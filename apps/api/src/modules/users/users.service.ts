import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole, UserStatus } from '@/database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async update(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    // Update only provided fields
    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName;
    }

    await this.userRepository.save(user);

    this.logger.log(`User updated: ${user.email}`);

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(userId);

    // Verify current password
    const isCurrentPasswordValid = await user.validatePassword(dto.currentPassword);
    if (!isCurrentPasswordValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    // Set new password
    user.password = dto.newPassword;
    await this.userRepository.save(user);

    this.logger.log(`Password changed for user: ${user.email}`);
  }

  async updateStatus(
    userId: string,
    status: UserStatus,
    adminId: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    const admin = await this.findById(adminId);

    // Only admins can change user status
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can change user status');
    }

    // Cannot change own status
    if (userId === adminId) {
      throw new ForbiddenException('Cannot change your own status');
    }

    user.status = status;
    await this.userRepository.save(user);

    this.logger.log(`User ${user.email} status changed to ${status} by admin ${admin.email}`);

    return user;
  }

  async softDelete(userId: string): Promise<void> {
    const user = await this.findById(userId);

    // Soft delete
    user.status = UserStatus.DELETED;
    await this.userRepository.softRemove(user);

    this.logger.log(`User soft deleted: ${user.email}`);
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['pets'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return safe user data (exclude sensitive fields)
    const { passwordHash, verificationToken, ...safeUser } = user;
    return safeUser;
  }
}
