'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Loader2, Camera } from 'lucide-react';
import { PostCard } from './post-card';
import { useCurrentPet } from '@/stores/auth.store';
import { useFeedStore } from '@/stores/feed.store';
import { EmptyState } from '@/components/ui/empty-state';

export function PostList() {
  const currentPet = useCurrentPet();
  const { posts, isLoading, hasMore, fetchFeed, fetchMorePosts, toggleLike, toggleBookmark, addComment } = useFeedStore();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (currentPet) {
      fetchFeed(currentPet.id);
    }
  }, [currentPet?.id, fetchFeed]);

  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && currentPet) {
          fetchMorePosts(currentPet.id);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasMore, currentPet, fetchMorePosts]
  );

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <EmptyState
        icon={Camera}
        title="No hay publicaciones"
        description="Sigue a otras mascotas o crea tu primera publicación para ver contenido aquí."
        actionLabel="Crear publicación"
        actionHref="/create"
      />
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <div key={post.id} ref={index === posts.length - 1 ? lastPostRef : undefined}>
          <PostCard
            post={post}
            onLike={() => currentPet && toggleLike(post.id, currentPet.id)}
            onBookmark={() => currentPet && toggleBookmark(post.id, currentPet.id)}
            onComment={(content) => currentPet && addComment(post.id, currentPet.id, content)}
          />
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Has visto todas las publicaciones
        </div>
      )}
    </div>
  );
}
