import {
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';
import { Pet } from './pet.entity';
import { Post } from './post.entity';

@Entity('likes')
export class Like {
  @PrimaryColumn({ name: 'pet_id', type: 'uuid' })
  @Index('idx_likes_pet')
  petId: string;

  @PrimaryColumn({ name: 'post_id', type: 'uuid' })
  @Index('idx_likes_post')
  postId: string;

  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
