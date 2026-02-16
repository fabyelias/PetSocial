'use client';

import { useEffect, useState } from 'react';
import { Loader2, Bell, Heart, MessageCircle, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { useCurrentPet } from '@/stores/auth.store';
import { formatRelativeTime } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow';
  petName: string;
  petId: string;
  petAvatar: string | null;
  postId?: string;
  content?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const currentPet = useCurrentPet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentPet) return;

    async function load() {
      // Get current pet's post IDs
      const { data: myPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('pet_id', currentPet!.id);

      const myPostIds = myPosts?.map((p) => p.id) || [];
      const allNotifications: Notification[] = [];

      if (myPostIds.length > 0) {
        // Recent likes
        const { data: likes } = await supabase
          .from('likes')
          .select(`
            post_id, created_at,
            pet:pets!pet_id(id, name, avatar_url)
          `)
          .in('post_id', myPostIds)
          .neq('pet_id', currentPet!.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (likes) {
          likes.forEach((l) => {
            const pet = l.pet as unknown as { id: string; name: string; avatar_url: string | null };
            allNotifications.push({
              id: `like-${pet.id}-${l.post_id}`,
              type: 'like',
              petName: pet.name,
              petId: pet.id,
              petAvatar: pet.avatar_url,
              postId: l.post_id,
              createdAt: l.created_at,
            });
          });
        }

        // Recent comments
        const { data: comments } = await supabase
          .from('comments')
          .select(`
            id, post_id, content, created_at,
            pet:pets!pet_id(id, name, avatar_url)
          `)
          .in('post_id', myPostIds)
          .neq('pet_id', currentPet!.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (comments) {
          comments.forEach((c) => {
            const pet = c.pet as unknown as { id: string; name: string; avatar_url: string | null };
            allNotifications.push({
              id: `comment-${c.id}`,
              type: 'comment',
              petName: pet.name,
              petId: pet.id,
              petAvatar: pet.avatar_url,
              postId: c.post_id,
              content: c.content,
              createdAt: c.created_at,
            });
          });
        }
      }

      // New followers
      const { data: followers } = await supabase
        .from('follows')
        .select(`
          created_at,
          follower:pets!follower_id(id, name, avatar_url)
        `)
        .eq('following_id', currentPet!.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (followers) {
        followers.forEach((f) => {
          const pet = f.follower as unknown as { id: string; name: string; avatar_url: string | null };
          allNotifications.push({
            id: `follow-${pet.id}`,
            type: 'follow',
            petName: pet.name,
            petId: pet.id,
            petAvatar: pet.avatar_url,
            createdAt: f.created_at,
          });
        });
      }

      allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(allNotifications.slice(0, 50));
      setIsLoading(false);
    }

    load();
  }, [currentPet?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Notificaciones</h1>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Sin notificaciones"
          description="Cuando alguien interactúe con tus publicaciones, lo verás aquí."
        />
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.postId ? `/post/${n.postId}` : `/pet/${n.petId}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <Avatar src={n.petAvatar} alt={n.petName} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{n.petName}</span>
                  {n.type === 'like' && ' le gustó tu publicación'}
                  {n.type === 'comment' && ` comentó: "${n.content?.slice(0, 50)}${(n.content?.length || 0) > 50 ? '...' : ''}"`}
                  {n.type === 'follow' && ' comenzó a seguirte'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatRelativeTime(n.createdAt)}
                </p>
              </div>
              <div className="shrink-0">
                {n.type === 'like' && <Heart className="w-4 h-4 text-red-500" />}
                {n.type === 'comment' && <MessageCircle className="w-4 h-4 text-primary-500" />}
                {n.type === 'follow' && <UserPlus className="w-4 h-4 text-green-500" />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
