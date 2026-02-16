'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { formatNumber, formatRelativeTime, cn } from '@/lib/utils';

interface PostMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  width: number;
  height: number;
}

interface PostPet {
  id: string;
  name: string;
  avatarUrl: string | null;
  species: string;
}

interface Post {
  id: string;
  pet: PostPet;
  caption: string;
  media: PostMedia[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked?: boolean;
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onBookmark?: () => void;
  onComment?: (content: string) => void;
}

export function PostCard({ post, onLike, onBookmark, onComment }: PostCardProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [commentText, setCommentText] = useState('');

  const media = post.media || [];
  const hasMultipleMedia = media.length > 1;
  const currentMedia = media[currentMediaIndex];
  const captionPreviewLength = 125;
  const shouldTruncateCaption = (post.caption || '').length > captionPreviewLength;

  const handlePrevMedia = () => {
    setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex((prev) =>
      prev < post.media.length - 1 ? prev + 1 : prev
    );
  };

  return (
    <article className="card p-0 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link
          href={`/pet/${post.pet.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar src={post.pet.avatarUrl} alt={post.pet.name} size="md" />
          <div>
            <h3 className="font-semibold text-sm">{post.pet.name}</h3>
            <p className="text-xs text-gray-500">{post.pet.species}</p>
          </div>
        </Link>

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <MoreHorizontal className="w-5 h-5 text-gray-600" />
        </button>
      </header>

      {/* Media */}
      {currentMedia && (
        <div className="relative bg-gray-100 dark:bg-gray-900">
          {/* Carousel navigation */}
          {hasMultipleMedia && currentMediaIndex > 0 && (
            <button
              onClick={handlePrevMedia}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 dark:bg-black/50 rounded-full flex items-center justify-center shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {hasMultipleMedia && currentMediaIndex < media.length - 1 && (
            <button
              onClick={handleNextMedia}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 dark:bg-black/50 rounded-full flex items-center justify-center shadow-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Media content */}
          {currentMedia.type === 'image' ? (
            <div className="relative aspect-square">
              <Image
                src={currentMedia.url}
                alt={`Foto de ${post.pet.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          ) : (
            <video
              src={currentMedia.url}
              controls
              className="w-full aspect-square object-cover"
            />
          )}

          {/* Carousel indicators */}
          {hasMultipleMedia && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {media.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    index === currentMediaIndex
                      ? 'bg-primary-500'
                      : 'bg-white/60'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={onLike}
              className={cn(
                'transition-transform active:scale-125',
                post.isLiked && 'text-red-500'
              )}
            >
              <Heart
                className={cn('w-6 h-6', post.isLiked && 'fill-current')}
              />
            </button>
            <Link href={`/post/${post.id}`}>
              <MessageCircle className="w-6 h-6" />
            </Link>
            <button>
              <Send className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={onBookmark}
            className={cn(post.isBookmarked && 'text-primary-500')}
          >
            <Bookmark
              className={cn('w-6 h-6', post.isBookmarked && 'fill-current')}
            />
          </button>
        </div>

        {/* Likes count */}
        <p className="font-semibold text-sm mb-2">
          {formatNumber(post.likesCount)} me gusta
        </p>

        {/* Caption */}
        <div className="text-sm">
          <Link
            href={`/pet/${post.pet.id}`}
            className="font-semibold hover:underline mr-2"
          >
            {post.pet.name}
          </Link>
          <span className="text-gray-800 dark:text-gray-200">
            {showFullCaption || !shouldTruncateCaption
              ? (post.caption || '')
              : `${(post.caption || '').slice(0, captionPreviewLength)}...`}
          </span>
          {shouldTruncateCaption && !showFullCaption && (
            <button
              onClick={() => setShowFullCaption(true)}
              className="text-gray-500 hover:text-gray-700 ml-1"
            >
              más
            </button>
          )}
        </div>

        {/* Comments preview */}
        {post.commentsCount > 0 && (
          <Link
            href={`/post/${post.id}`}
            className="block mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Ver los {post.commentsCount} comentarios
          </Link>
        )}

        {/* Timestamp */}
        <time className="block mt-2 text-xs text-gray-400">
          {formatRelativeTime(post.createdAt)}
        </time>
      </div>

      {/* Comment input */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (commentText.trim() && onComment) {
              onComment(commentText.trim());
              setCommentText('');
            }
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Añade un comentario..."
            className="flex-1 bg-transparent text-sm placeholder-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="text-primary-500 font-semibold text-sm hover:text-primary-600 disabled:opacity-50"
          >
            Publicar
          </button>
        </form>
      </div>
    </article>
  );
}
