import {
  Entity,
  Column,
  Index,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SoftDeletableEntity } from './base.entity';
import { Pet } from './pet.entity';
import { RefreshToken } from './refresh-token.entity';

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('users')
export class User extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_users_email', { where: '"deleted_at" IS NULL' })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  @Index('idx_users_role', { where: '"deleted_at" IS NULL' })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  @Index('idx_users_status', { where: '"deleted_at" IS NULL' })
  status: UserStatus;

  @Column({ name: 'display_name', type: 'varchar', length: 100, nullable: true })
  displayName: string | null;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ name: 'verification_token', type: 'varchar', length: 255, nullable: true })
  verificationToken: string | null;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'password_changed_at', type: 'timestamptz', nullable: true })
  passwordChangedAt: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
  lastActiveAt: Date | null;

  // Relations
  @OneToMany(() => Pet, (pet) => pet.owner)
  pets: Pet[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  // Transient property for password setting
  private _password: string;

  set password(value: string) {
    this._password = value;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this._password) {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
      this.passwordHash = await bcrypt.hash(this._password, rounds);
      this.passwordChangedAt = new Date();
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return this.lockedUntil > new Date();
  }

  isVerified(): boolean {
    return this.emailVerifiedAt !== null;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isLocked();
  }
}
