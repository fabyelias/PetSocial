'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Play } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface GridPost {
  id: string;
  likes_count: number;
  comments_count: number;
  media: {
    type: 'image' | 'video';
    url: string;
  }[];
}

interface PostGridProps {
  posts: GridPost[];
}

export function PostGrid({ posts }: PostGridProps) {
  if (posts.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => {
        const firstMedia = post.media[0];
        if (!firstMedia) return null;

        return (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="relative aspect-square group overflow-hidden bg-gray-100 dark:bg-gray-800"
          >
            <Image
              src={firstMedia.url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 200px"
            />
            {firstMedia.type === 'video' && (
              <div className="absolute top-2 right-2">
                <Play className="w-5 h-5 text-white drop-shadow-lg fill-current" />
              </div>
            )}
            {post.media.length > 1 && (
              <div className="absolute top-2 right-2 text-white text-xs font-bold drop-shadow-lg">
                +{post.media.length}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
              <span className="flex items-center gap-1 text-sm font-semibold">
                <Heart className="w-5 h-5 fill-current" />
                {formatNumber(post.likes_count)}
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold">
                <MessageCircle className="w-5 h-5 fill-current" />
                {formatNumber(post.comments_count)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
