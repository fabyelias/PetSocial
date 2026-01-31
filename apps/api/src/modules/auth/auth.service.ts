import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

import { User, UserStatus } from '@/database/entities/user.entity';
import { RefreshToken } from '@/database/entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    role: string;
    displayName: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create user
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      displayName: dto.displayName || null,
      status: UserStatus.ACTIVE, // In production, would be PENDING until email verified
    });
    user.password = dto.password;

    // Generate verification token
    user.verificationToken = this.generateSecureToken();

    await this.userRepository.save(user);

    this.logger.log(`New user registered: ${user.email}`);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
    };
  }

  async login(dto: LoginDto, deviceInfo?: { userAgent?: string; ip?: string }): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked()) {
      const unlockTime = user.lockedUntil!.toISOString();
      throw new UnauthorizedException(
        `Account is locked. Try again after ${unlockTime}`,
      );
    }

    // Check if account is active
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account has been suspended');
    }

    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(dto.password);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    await this.userRepository.save(user);

    this.logger.log(`User logged in: ${user.email}`);

    // Generate tokens
    const tokens = await this.generateTokens(user, deviceInfo);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
    };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthTokens> {
    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!storedToken.isValid()) {
      // Revoke the token if it's being reused after expiration
      if (!storedToken.isRevoked()) {
        storedToken.revokedAt = new Date();
        await this.refreshTokenRepository.save(storedToken);
      }
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = storedToken.user;

    if (!user.isActive()) {
      throw new UnauthorizedException('Account is not active');
    }

    // Revoke current refresh token (rotation)
    storedToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(storedToken);

    // Generate new tokens
    return this.generateTokens(user, storedToken.deviceInfo);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Revoke specific token
      const tokenHash = this.hashToken(refreshToken);
      await this.refreshTokenRepository.update(
        { tokenHash, userId },
        { revokedAt: new Date() },
      );
    } else {
      // Revoke all tokens for user
      await this.refreshTokenRepository.update(
        { userId, revokedAt: null },
        { revokedAt: new Date() },
      );
    }

    this.logger.log(`User logged out: ${userId}`);
  }

  async revokeAllTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: null },
      { revokedAt: new Date() },
    );

    this.logger.log(`All tokens revoked for user: ${userId}`);
  }

  async validateUser(payload: TokenPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive()) {
      return null;
    }

    // Update last active timestamp (debounced in production)
    user.lastActiveAt = new Date();
    await this.userRepository.save(user);

    return user;
  }

  private async generateTokens(
    user: User,
    deviceInfo?: { userAgent?: string; ip?: string } | null,
  ): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = this.generateSecureToken();
    const tokenHash = this.hashToken(refreshToken);

    // Calculate expiration
    const refreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
      '7d',
    );
    const expiresAt = this.calculateExpiration(refreshExpiresIn);

    // Store refresh token
    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      deviceInfo: deviceInfo || null,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    // Clean up old tokens (keep last 5 per user)
    await this.cleanupOldTokens(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiresInSeconds(),
    };
  }

  private async handleFailedLogin(user: User): Promise<void> {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(
        Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000,
      );
      this.logger.warn(`Account locked due to failed attempts: ${user.email}`);
    }

    await this.userRepository.save(user);
  }

  private async cleanupOldTokens(userId: string): Promise<void> {
    // Keep only the last 5 active tokens per user
    const tokens = await this.refreshTokenRepository.find({
      where: { userId, revokedAt: null },
      order: { createdAt: 'DESC' },
    });

    if (tokens.length > 5) {
      const tokensToRevoke = tokens.slice(5);
      const idsToRevoke = tokensToRevoke.map((t) => t.id);
      await this.refreshTokenRepository.update(idsToRevoke, {
        revokedAt: new Date(),
      });
    }
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private calculateExpiration(duration: string): Date {
    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  private getExpiresInSeconds(): number {
    const expiresIn = this.configService.get<string>('jwt.expiresIn', '15m');
    const match = expiresIn.match(/^(\d+)([dhms])$/);

    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * multipliers[unit];
  }
}
