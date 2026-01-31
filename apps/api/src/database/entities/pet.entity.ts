import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SoftDeletableEntity } from './base.entity';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Follow } from './follow.entity';

export enum PetSpecies {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  RABBIT = 'rabbit',
  HAMSTER = 'hamster',
  FISH = 'fish',
  REPTILE = 'reptile',
  OTHER = 'other',
}

@Entity('pets')
export class Pet extends SoftDeletableEntity {
  @Column({ name: 'owner_id', type: 'uuid' })
  @Index('idx_pets_owner', { where: '"deleted_at" IS NULL' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.pets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({
    type: 'enum',
    enum: PetSpecies,
  })
  @Index('idx_pets_species', { where: '"deleted_at" IS NULL' })
  species: PetSpecies;

  @Column({ type: 'varchar', length: 100, nullable: true })
  breed: string | null;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bio: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'cover_url', type: 'varchar', length: 500, nullable: true })
  coverUrl: string | null;

  @Column({ name: 'location_city', type: 'varchar', length: 100, nullable: true })
  locationCity: string | null;

  @Column({ name: 'location_country', type: 'varchar', length: 100, nullable: true })
  @Index('idx_pets_location', { where: '"deleted_at" IS NULL' })
  locationCountry: string | null;

  // Stats - denormalized for performance
  @Column({ name: 'followers_count', type: 'int', default: 0 })
  @Index('idx_pets_followers', { where: '"deleted_at" IS NULL' })
  followersCount: number;

  @Column({ name: 'following_count', type: 'int', default: 0 })
  followingCount: number;

  @Column({ name: 'posts_count', type: 'int', default: 0 })
  postsCount: number;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @OneToMany(() => Post, (post) => post.pet)
  posts: Post[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  // Computed property for age
  getAge(): number | null {
    if (!this.birthDate) return null;
    const today = new Date();
    const birthDate = new Date(this.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
