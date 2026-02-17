'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Avatar } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/utils';

interface Story {
  id: string;
  media_url: string;
  caption: string | null;
  created_at: string;
}

interface StoryViewerProps {
  pet: {
    petId: string;
    petName: string;
    petAvatar: string | null;
    stories: Story[];
  };
  onClose: () => void;
  onViewed: (storyId: string) => void;
  currentPetId: string;
}

const STORY_DURATION = 5000; // 5 seconds per story

export function StoryViewer({ pet, onClose, onViewed, currentPetId }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const story = pet.stories[currentIndex];
  const isOwnStory = pet.petId === currentPetId;

  // Mark story as viewed
  useEffect(() => {
    if (!story || isOwnStory) return;

    supabase
      .from('story_views')
      .upsert({ story_id: story.id, pet_id: currentPetId }, { onConflict: 'story_id,pet_id' })
      .then(() => {
        onViewed(story.id);
      });
  }, [story?.id, currentPetId, isOwnStory]);

  // Auto-advance progress bar
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (STORY_DURATION / 50));
        if (next >= 100) {
          // Move to next story or close
          if (currentIndex < pet.stories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, pet.stories.length, onClose]);

  // Reset progress on story change
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < pet.stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, pet.stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      {currentIndex < pet.stories.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Story content */}
      <div
        className="relative w-full max-w-md h-full max-h-[90vh] mx-auto"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3">
          {pet.stories.map((s, i) => (
            <div
              key={s.id}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-75"
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Pet info header */}
        <div className="absolute top-6 left-0 right-0 z-10 flex items-center gap-3 px-4">
          <Avatar src={pet.petAvatar} alt={pet.petName} size="sm" />
          <div>
            <p className="text-white text-sm font-semibold">{pet.petName}</p>
            <p className="text-white/60 text-xs">{formatRelativeTime(story.created_at)}</p>
          </div>
        </div>

        {/* Image */}
        <div className="w-full h-full rounded-xl overflow-hidden bg-gray-900">
          <Image
            src={story.media_url}
            alt={`Historia de ${pet.petName}`}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white text-sm text-center">{story.caption}</p>
          </div>
        )}

        {/* Tap zones for navigation */}
        <div className="absolute inset-0 z-[5] flex">
          <div className="w-1/3 h-full" onClick={goPrev} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" onClick={goNext} />
        </div>
      </div>
    </div>
  );
}
