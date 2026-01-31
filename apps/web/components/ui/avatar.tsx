'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

const sizes = {
  xs: 'avatar-xs',
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
  xl: 'avatar-xl',
  '2xl': 'avatar-2xl',
};

const sizePx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 96,
};

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: keyof typeof sizes;
  className?: string;
  showStoryRing?: boolean;
  hasUnseenStory?: boolean;
}

export function Avatar({
  src,
  alt,
  size = 'md',
  className,
  showStoryRing = false,
  hasUnseenStory = false,
}: AvatarProps) {
  const initials = alt
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const content = src ? (
    <Image
      src={src}
      alt={alt}
      width={sizePx[size]}
      height={sizePx[size]}
      className="object-cover w-full h-full"
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
      <span
        className={cn(
          size === 'xs' && 'text-2xs',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
          size === 'xl' && 'text-lg',
          size === '2xl' && 'text-2xl'
        )}
      >
        {initials || '🐾'}
      </span>
    </div>
  );

  if (showStoryRing) {
    return (
      <div
        className={cn(
          'rounded-full p-0.5',
          hasUnseenStory
            ? 'bg-gradient-to-tr from-primary-500 via-accent-500 to-secondary-500'
            : 'bg-gray-300 dark:bg-gray-700'
        )}
      >
        <div className="bg-white dark:bg-gray-950 rounded-full p-0.5">
          <div className={cn('avatar', sizes[size], className)}>{content}</div>
        </div>
      </div>
    );
  }

  return <div className={cn('avatar', sizes[size], className)}>{content}</div>;
}
