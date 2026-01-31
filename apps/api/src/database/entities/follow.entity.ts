import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
  Check,
} from 'typeorm';
import { Pet } from './pet.entity';

@Entity('follows')
@Check('"follower_id" != "following_id"')
export class Follow {
  @PrimaryColumn({ name: 'follower_id', type: 'uuid' })
  @Index('idx_follows_follower')
  followerId: string;

  @PrimaryColumn({ name: 'following_id', type: 'uuid' })
  @Index('idx_follows_following')
  followingId: string;

  @ManyToOne(() => Pet, (pet) => pet.following, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: Pet;

  @ManyToOne(() => Pet, (pet) => pet.followers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: Pet;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
