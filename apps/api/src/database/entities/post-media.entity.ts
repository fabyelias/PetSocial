import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Check,
} from 'typeorm';
import { Post } from './post.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('post_media')
@Check('"position" < 10')
export class PostMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', type: 'uuid' })
  @Index('idx_post_media_post')
  postId: string;

  @ManyToOne(() => Post, (post) => post.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({
    name: 'media_type',
    type: 'enum',
    enum: MediaType,
  })
  mediaType: MediaType;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null; // Only for videos

  @Column({ name: 'file_size_bytes', type: 'bigint', nullable: true })
  fileSizeBytes: number | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType: string | null;

  @Column({ type: 'smallint', default: 0 })
  position: number;

  @Column({ name: 'is_processed', type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ name: 'processing_error', type: 'varchar', length: 255, nullable: true })
  processingError: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  isVideo(): boolean {
    return this.mediaType === MediaType.VIDEO;
  }

  isImage(): boolean {
    return this.mediaType === MediaType.IMAGE;
  }

  getAspectRatio(): number | null {
    if (!this.width || !this.height) return null;
    return this.width / this.height;
  }
}
