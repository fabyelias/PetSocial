'use client';

import { useEffect, useState } from 'react';
import { Loader2, Compass } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PostGrid } from '@/components/pet/post-grid';
import { EmptyState } from '@/components/ui/empty-state';

interface ExplorePost {
  id: string;
  likes_count: number;
  comments_count: number;
  media: { type: 'image' | 'video'; url: string }[];
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('posts')
        .select(`
          id, likes_count, comments_count,
          media:post_media(type, url, position)
        `)
        .eq('visibility', 'public')
        .eq('is_hidden', false)
        .order('likes_count', { ascending: false })
        .limit(30);

      if (data) {
        setPosts(data.map((p) => ({
          id: p.id,
          likes_count: p.likes_count,
          comments_count: p.comments_count,
          media: ((p.media as unknown as { type: 'image' | 'video'; url: string; position: number }[]) || [])
            .sort((a, b) => a.position - b.position)
            .map((m) => ({ type: m.type, url: m.url })),
        })));
      }
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Explorar</h1>
        <Link href="/explore/pets" className="text-sm text-primary-600 hover:text-primary-500 font-medium">
          Ver mascotas
        </Link>
      </div>

      {posts.length > 0 ? (
        <PostGrid posts={posts} />
      ) : (
        <EmptyState
          icon={Compass}
          title="Nada por aquí"
          description="Aún no hay publicaciones para explorar. Sé el primero en publicar."
          actionLabel="Crear publicación"
          actionHref="/create"
        />
      )}
    </div>
  );
}
