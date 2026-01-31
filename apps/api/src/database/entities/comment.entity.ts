import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SoftDeletableEntity } from './base.entity';
import { Post } from './post.entity';
import { Pet } from './pet.entity';

@Entity('comments')
export class Comment extends SoftDeletableEntity {
  @Column({ name: 'post_id', type: 'uuid' })
  @Index('idx_comments_post', { where: '"deleted_at" IS NULL' })
  postId: string;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'pet_id', type: 'uuid' })
  @Index('idx_comments_pet', { where: '"deleted_at" IS NULL' })
  petId: string;

  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  @Index('idx_comments_parent', { where: '"deleted_at" IS NULL' })
  parentId: string | null;

  @ManyToOne(() => Comment, (comment) => comment.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @Column({ type: 'varchar', length: 1000 })
  content: string;

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({ name: 'replies_count', type: 'int', default: 0 })
  repliesCount: number;

  @Column({ name: 'is_hidden', type: 'boolean', default: false })
  isHidden: boolean;

  isReply(): boolean {
    return this.parentId !== null;
  }
}
