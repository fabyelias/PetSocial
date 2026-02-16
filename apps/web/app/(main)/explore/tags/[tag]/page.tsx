'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Hash, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PostGrid } from '@/components/pet/post-grid';
import { EmptyState } from '@/components/ui/empty-state';

interface TagPost {
  id: string;
  likes_count: number;
  comments_count: number;
  media: { type: 'image' | 'video'; url: string }[];
}

export default function TagPage() {
  const params = useParams();
  const tag = decodeURIComponent(params.tag as string);
  const [posts, setPosts] = useState<TagPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('posts')
        .select(`
          id, likes_count, comments_count,
          media:post_media(type, url, position)
        `)
        .ilike('caption', `%#${tag}%`)
        .eq('visibility', 'public')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
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
  }, [tag]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/explore"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">#{tag}</h1>
          <p className="text-sm text-gray-500">{posts.length} publicaciones</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : posts.length > 0 ? (
        <PostGrid posts={posts} />
      ) : (
        <EmptyState
          icon={Hash}
          title="Sin publicaciones"
          description={`No hay publicaciones con #${tag}`}
          actionLabel="Explorar"
          actionHref="/explore"
        />
      )}
    </div>
  );
}
