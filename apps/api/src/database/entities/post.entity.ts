import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SoftDeletableEntity } from './base.entity';
import { Pet } from './pet.entity';
import { PostMedia } from './post-media.entity';
import { Like } from './like.entity';
import { Comment } from './comment.entity';

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

@Entity('posts')
@Index('idx_posts_feed', ['createdAt', 'engagementScore'], {
  where: '"deleted_at" IS NULL AND "is_hidden" = FALSE AND "visibility" = \'public\'',
})
export class Post extends SoftDeletableEntity {
  @Column({ name: 'pet_id', type: 'uuid' })
  @Index('idx_posts_pet')
  petId: string;

  @ManyToOne(() => Pet, (pet) => pet.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column({ type: 'varchar', length: 2200, nullable: true })
  caption: string | null;

  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  // Stats - denormalized for performance
  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({ name: 'comments_count', type: 'int', default: 0 })
  commentsCount: number;

  @Column({ name: 'shares_count', type: 'int', default: 0 })
  sharesCount: number;

  // For feed algorithm
  @Column({
    name: 'engagement_score',
    type: 'float',
    default: 0,
  })
  @Index('idx_posts_engagement', { where: '"deleted_at" IS NULL AND "is_hidden" = FALSE' })
  engagementScore: number;

  // Moderation
  @Column({ name: 'is_hidden', type: 'boolean', default: false })
  isHidden: boolean;

  @Column({ name: 'hidden_reason', type: 'varchar', length: 255, nullable: true })
  hiddenReason: string | null;

  // Relations
  @OneToMany(() => PostMedia, (media) => media.post, { cascade: true })
  media: PostMedia[];

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  // Calculate engagement score based on interactions
  calculateEngagement(): number {
    // Formula: (likes * 1) + (comments * 3) + (shares * 5)
    // Weighted to favor comments and shares as higher engagement
    const score =
      this.likesCount * 1 +
      this.commentsCount * 3 +
      this.sharesCount * 5;

    // Apply time decay (posts lose relevance over time)
    const hoursOld = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
    const decayFactor = Math.pow(0.95, hoursOld / 24); // 5% decay per day

    return score * decayFactor;
  }
}
