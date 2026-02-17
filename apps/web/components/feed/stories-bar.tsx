'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCurrentPet } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { StoryViewer } from './story-viewer';
import { StoryCreate } from './story-create';

interface PetWithStories {
  petId: string;
  petName: string;
  petAvatar: string | null;
  stories: {
    id: string;
    media_url: string;
    caption: string | null;
    created_at: string;
  }[];
  hasUnseen: boolean;
}

export function StoriesBar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentPet = useCurrentPet();
  const [petsWithStories, setPetsWithStories] = useState<PetWithStories[]>([]);
  const [myStories, setMyStories] = useState<PetWithStories | null>(null);
  const [viewingPet, setViewingPet] = useState<PetWithStories | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!currentPet) return;

    async function loadStories() {
      // Get my own stories
      const { data: ownStories } = await supabase
        .from('stories')
        .select('id, media_url, caption, created_at')
        .eq('pet_id', currentPet!.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (ownStories && ownStories.length > 0) {
        setMyStories({
          petId: currentPet!.id,
          petName: currentPet!.name,
          petAvatar: currentPet!.avatarUrl ?? null,
          stories: ownStories,
          hasUnseen: false,
        });
      }

      // Get accepted follows
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentPet!.id)
        .eq('status', 'accepted');

      if (!follows || follows.length === 0) return;
      const followingIds = follows.map((f) => f.following_id);

      // Get active stories from followed pets
      const { data: stories } = await supabase
        .from('stories')
        .select(`
          id, media_url, caption, created_at, pet_id,
          pet:pets!pet_id(id, name, avatar_url)
        `)
        .in('pet_id', followingIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (!stories || stories.length === 0) return;

      // Get which stories the current pet has viewed
      const storyIds = stories.map((s) => s.id);
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('pet_id', currentPet!.id)
        .in('story_id', storyIds);

      const viewedSet = new Set(views?.map((v) => v.story_id) || []);

      // Group stories by pet
      const petMap = new Map<string, PetWithStories>();
      for (const s of stories) {
        const pet = s.pet as unknown as { id: string; name: string; avatar_url: string | null };
        if (!petMap.has(pet.id)) {
          petMap.set(pet.id, {
            petId: pet.id,
            petName: pet.name,
            petAvatar: pet.avatar_url,
            stories: [],
            hasUnseen: false,
          });
        }
        const entry = petMap.get(pet.id)!;
        entry.stories.push({
          id: s.id,
          media_url: s.media_url,
          caption: s.caption,
          created_at: s.created_at,
        });
        if (!viewedSet.has(s.id)) {
          entry.hasUnseen = true;
        }
      }

      // Sort: unseen first
      const sorted = Array.from(petMap.values()).sort((a, b) => {
        if (a.hasUnseen && !b.hasUnseen) return -1;
        if (!a.hasUnseen && b.hasUnseen) return 1;
        return 0;
      });

      setPetsWithStories(sorted);
    }

    loadStories();
  }, [currentPet?.id]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  const handleStoryCreated = () => {
    setShowCreate(false);
    // Reload stories
    if (currentPet) {
      supabase
        .from('stories')
        .select('id, media_url, caption, created_at')
        .eq('pet_id', currentPet.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setMyStories({
              petId: currentPet.id,
              petName: currentPet.name,
              petAvatar: currentPet.avatarUrl ?? null,
              stories: data,
              hasUnseen: false,
            });
          }
        });
    }
  };

  const handleMarkViewed = (storyId: string) => {
    // Update local state to reflect viewed
    setPetsWithStories((prev) =>
      prev.map((p) => {
        const allViewed = p.stories.every(
          (s) => s.id === storyId || !p.hasUnseen
        );
        return { ...p, hasUnseen: !allViewed && p.hasUnseen };
      })
    );
  };

  if (!currentPet) return null;

  const hasContent = myStories || petsWithStories.length > 0;

  return (
    <>
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
          <button
            className="flex flex-col items-center gap-1.5 shrink-0"
            onClick={() => myStories ? setViewingPet(myStories) : setShowCreate(true)}
          >
            <div className="relative">
              <Avatar
                src={currentPet.avatarUrl}
                alt={currentPet.name}
                size="lg"
                showStoryRing={!!myStories}
                hasUnseenStory={false}
              />
              {!myStories && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 max-w-16 truncate">
              Tu historia
            </span>
          </button>

          {/* Followed pets with stories */}
          {petsWithStories.map((pet) => (
            <button
              key={pet.petId}
              className="flex flex-col items-center gap-1.5 shrink-0"
              onClick={() => setViewingPet(pet)}
            >
              <Avatar
                src={pet.petAvatar}
                alt={pet.petName}
                size="lg"
                showStoryRing
                hasUnseenStory={pet.hasUnseen}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 max-w-16 truncate">
                {pet.petName}
              </span>
            </button>
          ))}

          {/* If no stories, show placeholder text */}
          {!hasContent && (
            <div className="flex items-center px-4">
              <p className="text-sm text-gray-400">Crea tu primera historia</p>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {viewingPet && (
        <StoryViewer
          pet={viewingPet}
          onClose={() => setViewingPet(null)}
          onViewed={handleMarkViewed}
          currentPetId={currentPet.id}
        />
      )}

      {/* Story Create Modal */}
      {showCreate && (
        <StoryCreate
          onClose={() => setShowCreate(false)}
          onCreated={handleStoryCreated}
        />
      )}
    </>
  );
}
