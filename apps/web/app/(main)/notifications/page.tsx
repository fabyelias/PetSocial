'use client';

import { useEffect, useState } from 'react';
import { Loader2, Bell, Heart, MessageCircle, UserPlus, Check, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
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

interface FriendRequest {
  followerId: string;
  petName: string;
  petAvatar: string | null;
  species: string;
  createdAt: string;
}

const speciesLabels: Record<string, string> = {
  dog: 'Perro', cat: 'Gato', bird: 'Ave', rabbit: 'Conejo',
  hamster: 'Hamster', fish: 'Pez', reptile: 'Reptil', other: 'Otro',
};

export default function NotificationsPage() {
  const currentPet = useCurrentPet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentPet) return;

    // Realtime: recargar cuando haya nuevas interacciones para este pet
    const channel = supabase
      .channel(`notifs-page-${currentPet.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: `following_id=eq.${currentPet.id}` }, () => load())
      .subscribe();

    async function load() {
      // Load pending friend requests
      const { data: pendingFollows } = await supabase
        .from('follows')
        .select(`
          created_at,
          follower:pets!follower_id(id, name, avatar_url, species)
        `)
        .eq('following_id', currentPet!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingFollows) {
        setFriendRequests(
          pendingFollows.map((f) => {
            const pet = f.follower as unknown as { id: string; name: string; avatar_url: string | null; species: string };
            return {
              followerId: pet.id,
              petName: pet.name,
              petAvatar: pet.avatar_url,
              species: pet.species,
              createdAt: f.created_at,
            };
          })
        );
      }

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

      // Accepted followers (show as notification)
      const { data: followers } = await supabase
        .from('follows')
        .select(`
          created_at,
          follower:pets!follower_id(id, name, avatar_url)
        `)
        .eq('following_id', currentPet!.id)
        .eq('status', 'accepted')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPet?.id]);

  const handleAcceptRequest = async (followerId: string) => {
    if (!currentPet) return;
    try {
      await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('follower_id', followerId)
        .eq('following_id', currentPet.id);

      setFriendRequests((prev) => prev.filter((r) => r.followerId !== followerId));
      toast.success('Solicitud aceptada');
    } catch {
      toast.error('Error al aceptar');
    }
  };

  const handleRejectRequest = async (followerId: string) => {
    if (!currentPet) return;
    try {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', currentPet.id);

      setFriendRequests((prev) => prev.filter((r) => r.followerId !== followerId));
      toast.success('Solicitud rechazada');
    } catch {
      toast.error('Error al rechazar');
    }
  };

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

      {/* Pending Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Solicitudes de amistad ({friendRequests.length})
          </h2>
          <div className="space-y-2">
            {friendRequests.map((req) => (
              <div
                key={req.followerId}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20"
              >
                <Link href={`/pet/${req.followerId}`}>
                  <Avatar src={req.petAvatar} alt={req.petName} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/pet/${req.followerId}`} className="hover:underline">
                    <p className="text-sm font-semibold">{req.petName}</p>
                  </Link>
                  <p className="text-xs text-gray-500">
                    {speciesLabels[req.species] || req.species} · {formatRelativeTime(req.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleAcceptRequest(req.followerId)}
                    className="btn-primary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aceptar
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req.followerId)}
                    className="btn-outline text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-3.5 h-3.5" />
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Notifications */}
      {notifications.length === 0 && friendRequests.length === 0 ? (
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
                  {n.type === 'follow' && ' te sigue'}
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
