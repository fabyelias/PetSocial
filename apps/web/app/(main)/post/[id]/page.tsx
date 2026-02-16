'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { PostCard } from '@/components/feed/post-card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { useCurrentPet } from '@/stores/auth.store';
import { formatRelativeTime } from '@/lib/utils';
import { Camera } from 'lucide-react';

const speciesLabels: Record<string, string> = {
  dog: 'Perro', cat: 'Gato', bird: 'Ave', rabbit: 'Conejo',
  hamster: 'Hamster', fish: 'Pez', reptile: 'Reptil', other: 'Otro',
};

interface Comment {
  id: string;
  content: string;
  created_at: string;
  pet: {
    id: string;
    name: string;
    avatar_url: string | null;
    species: string;
  };
  replies: Comment[];
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const currentPet = useCurrentPet();
  const [post, setPost] = useState<{
    id: string;
    pet: { id: string; name: string; avatarUrl: string | null; species: string };
    caption: string;
    media: { id: string; type: 'image' | 'video'; url: string; width: number; height: number }[];
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
    isBookmarked: boolean;
    createdAt: string;
  } | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: postData } = await supabase
        .from('posts')
        .select(`
          *,
          pet:pets!pet_id(id, name, species, avatar_url),
          media:post_media(id, type, url, width, height, position)
        `)
        .eq('id', postId)
        .single();

      if (!postData) {
        setIsLoading(false);
        return;
      }

      const pet = postData.pet as unknown as { id: string; name: string; species: string; avatar_url: string | null };
      const media = (postData.media as unknown as { id: string; type: 'image' | 'video'; url: string; width: number | null; height: number | null; position: number }[]) || [];

      let isLiked = false;
      let isBookmarked = false;

      if (currentPet) {
        const [{ data: likeData }, { data: bookmarkData }] = await Promise.all([
          supabase.from('likes').select('pet_id').eq('pet_id', currentPet.id).eq('post_id', postId).single(),
          supabase.from('bookmarks').select('pet_id').eq('pet_id', currentPet.id).eq('post_id', postId).single(),
        ]);
        isLiked = !!likeData;
        isBookmarked = !!bookmarkData;
      }

      setPost({
        id: postData.id,
        pet: {
          id: pet.id,
          name: pet.name,
          avatarUrl: pet.avatar_url,
          species: speciesLabels[pet.species] || pet.species,
        },
        caption: postData.caption || '',
        media: media
          .sort((a, b) => a.position - b.position)
          .map((m) => ({ id: m.id, type: m.type, url: m.url, width: m.width || 800, height: m.height || 800 })),
        likesCount: postData.likes_count,
        commentsCount: postData.comments_count,
        isLiked,
        isBookmarked,
        createdAt: postData.created_at,
      });

      // Load comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select(`
          id, content, created_at,
          pet:pets!pet_id(id, name, avatar_url, species)
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });

      if (commentsData) {
        setComments(
          commentsData.map((c) => ({
            id: c.id,
            content: c.content,
            created_at: c.created_at,
            pet: c.pet as unknown as { id: string; name: string; avatar_url: string | null; species: string },
            replies: [],
          }))
        );
      }

      setIsLoading(false);
    }
    load();
  }, [postId, currentPet?.id]);

  const handleLike = async () => {
    if (!currentPet || !post) return;
    const wasLiked = post.isLiked;

    setPost({
      ...post,
      isLiked: !wasLiked,
      likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1,
    });

    try {
      if (wasLiked) {
        await supabase.from('likes').delete().eq('pet_id', currentPet.id).eq('post_id', postId);
      } else {
        await supabase.from('likes').insert({ pet_id: currentPet.id, post_id: postId });
      }
    } catch {
      setPost({
        ...post,
        isLiked: wasLiked,
        likesCount: wasLiked ? post.likesCount + 1 : post.likesCount - 1,
      });
    }
  };

  const handleBookmark = async () => {
    if (!currentPet || !post) return;
    const was = post.isBookmarked;
    setPost({ ...post, isBookmarked: !was });

    try {
      if (was) {
        await supabase.from('bookmarks').delete().eq('pet_id', currentPet.id).eq('post_id', postId);
      } else {
        await supabase.from('bookmarks').insert({ pet_id: currentPet.id, post_id: postId });
      }
    } catch {
      setPost({ ...post, isBookmarked: was });
    }
  };

  const handleComment = async () => {
    if (!currentPet || !commentText.trim()) return;
    setIsCommenting(true);

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          pet_id: currentPet.id,
          content: commentText.trim(),
        })
        .select(`
          id, content, created_at,
          pet:pets!pet_id(id, name, avatar_url, species)
        `)
        .single();

      if (error) throw error;

      setComments((prev) => [
        ...prev,
        {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          pet: data.pet as unknown as { id: string; name: string; avatar_url: string | null; species: string },
          replies: [],
        },
      ]);

      if (post) setPost({ ...post, commentsCount: post.commentsCount + 1 });
      setCommentText('');
    } catch {
      toast.error('Error al comentar');
    } finally {
      setIsCommenting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <EmptyState
        icon={Camera}
        title="Publicación no encontrada"
        description="Esta publicación no existe o fue eliminada."
        actionLabel="Volver al feed"
        actionHref="/feed"
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/feed" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">Publicación</h1>
      </div>

      <PostCard
        post={post}
        onLike={handleLike}
        onBookmark={handleBookmark}
        onComment={(content) => {
          setCommentText(content);
          handleComment();
        }}
      />

      {/* Comments */}
      <div className="mt-4 card p-4">
        <h2 className="font-semibold text-sm mb-4">
          Comentarios ({post.commentsCount})
        </h2>

        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Link href={`/pet/${c.pet.id}`}>
                  <Avatar src={c.pet.avatar_url} alt={c.pet.name} size="sm" />
                </Link>
                <div className="flex-1">
                  <p className="text-sm">
                    <Link href={`/pet/${c.pet.id}`} className="font-semibold hover:underline mr-1">
                      {c.pet.name}
                    </Link>
                    {c.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(c.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Sin comentarios aún. Sé el primero.
          </p>
        )}

        {/* Comment input */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {currentPet && (
              <Avatar src={currentPet.avatarUrl} alt={currentPet.name} size="sm" />
            )}
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-transparent text-sm placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim() || isCommenting}
              className="text-primary-500 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
