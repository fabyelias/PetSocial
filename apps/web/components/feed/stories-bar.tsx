'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCurrentPet } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface FollowedPet {
  id: string;
  name: string;
  avatar_url: string | null;
}

export function StoriesBar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentPet = useCurrentPet();
  const [followedPets, setFollowedPets] = useState<FollowedPet[]>([]);

  useEffect(() => {
    if (!currentPet) return;
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentPet.id)
      .then(async ({ data }) => {
        if (!data || data.length === 0) return;
        const ids = data.map((f) => f.following_id);
        const { data: pets } = await supabase
          .from('pets')
          .select('id, name, avatar_url')
          .in('id', ids)
          .limit(15);
        if (pets) setFollowedPets(pets);
      });
  }, [currentPet?.id]);

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

        {/* Followed pets */}
        {followedPets.map((pet) => (
          <Link
            key={pet.id}
            href={`/pet/${pet.id}`}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <Avatar
              src={pet.avatar_url}
              alt={pet.name}
              size="lg"
              showStoryRing
              hasUnseenStory
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 max-w-16 truncate">
              {pet.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
