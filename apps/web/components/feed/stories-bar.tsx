'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCurrentPet } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// TODO: Fetch from API
const mockStories = [
  { id: '1', petName: 'Luna', avatarUrl: null, hasUnseenStory: true },
  { id: '2', petName: 'Rocky', avatarUrl: null, hasUnseenStory: true },
  { id: '3', petName: 'Michi', avatarUrl: null, hasUnseenStory: false },
  { id: '4', petName: 'Bella', avatarUrl: null, hasUnseenStory: true },
  { id: '5', petName: 'Max', avatarUrl: null, hasUnseenStory: false },
  { id: '6', petName: 'Coco', avatarUrl: null, hasUnseenStory: true },
  { id: '7', petName: 'Simba', avatarUrl: null, hasUnseenStory: false },
  { id: '8', petName: 'Nala', avatarUrl: null, hasUnseenStory: true },
];

export function StoriesBar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentPet = useCurrentPet();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="card relative">
      {/* Scroll buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 hidden md:flex"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 hidden md:flex"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Stories scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1"
      >
        {/* My story / Add story */}
        <button className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="relative">
            <Avatar
              src={currentPet?.avatarUrl}
              alt={currentPet?.name || 'Mi historia'}
              size="lg"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 max-w-16 truncate">
            Tu historia
          </span>
        </button>

        {/* Other stories */}
        {mockStories.map((story) => (
          <button
            key={story.id}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <Avatar
              src={story.avatarUrl}
              alt={story.petName}
              size="lg"
              showStoryRing
              hasUnseenStory={story.hasUnseenStory}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 max-w-16 truncate">
              {story.petName}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
