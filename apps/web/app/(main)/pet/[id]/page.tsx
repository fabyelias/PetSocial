'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, MapPin, Calendar, Settings, Grid3X3, Bookmark } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/avatar';
import { PostGrid } from '@/components/pet/post-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { useCurrentPet, useUser } from '@/stores/auth.store';
import { formatNumber, cn } from '@/lib/utils';
import { Camera } from 'lucide-react';

const speciesLabels: Record<string, string> = {
  dog: 'Perro', cat: 'Gato', bird: 'Ave', rabbit: 'Conejo',
  hamster: 'Hamster', fish: 'Pez', reptile: 'Reptil', other: 'Otro',
};

interface PetProfile {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  birth_date: string | null;
  city: string | null;
  country: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_private: boolean; // profile visibility flag
}

interface PetPost {
  id: string;
  likes_count: number;
  comments_count: number;
  media: { type: 'image' | 'video'; url: string }[];
}

export default function PetProfilePage() {
  const params = useParams();
  const petId = params.id as string;
  const currentPet = useCurrentPet();
  const user = useUser();
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [posts, setPosts] = useState<PetPost[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<PetPost[]>([]);
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const isOwnPet = pet?.owner_id === user?.id;

  useEffect(() => {
    async function loadPet() {
      setIsLoading(true);

      const { data: petData } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      if (!petData) {
        setIsLoading(false);
        return;
      }

      // determine follow status and whether we can show posts
      let allowedToView = true;

      if (currentPet && currentPet.id !== petId) {
        const { data: followData } = await supabase
          .from('follows')
          .select('follower_id, status')
          .eq('follower_id', currentPet.id)
          .eq('following_id', petId)
          .single();

        if (followData) {
          setFollowStatus(followData.status as 'pending' | 'accepted');
          if (petData.is_private && followData.status !== 'accepted') {
            allowedToView = false;
          }
        } else {
          setFollowStatus('none');
          if (petData.is_private) {
            allowedToView = false;
          }
        }
      }

      setPet(petData);

      if (allowedToView) {
        const { data: postsData } = await supabase
          .from('posts')
          .select(`
          id, likes_count, comments_count,
          media:post_media(type, url, position)
        `)
          .eq('pet_id', petId)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false });

        if (postsData) {
          setPosts(
            postsData.map((p) => ({
              id: p.id,
              likes_count: p.likes_count,
              comments_count: p.comments_count,
              media: ((p.media as unknown as { type: 'image' | 'video'; url: string; position: number }[]) || [])
                .sort((a, b) => a.position - b.position)
                .map((m) => ({ type: m.type, url: m.url })),
            }))
          );
        }
      }

      setIsLoading(false);
    }

    loadPet();
  }, [petId, currentPet?.id, user?.id]);

  const loadBookmarks = async () => {
    if (!currentPet || activeTab !== 'saved') return;
    const { data } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('pet_id', currentPet.id);

    if (data && data.length > 0) {
      const postIds = data.map((b) => b.post_id);
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id, likes_count, comments_count,
          media:post_media(type, url, position)
        `)
        .in('id', postIds)
        .eq('is_hidden', false);

      if (postsData) {
        setBookmarkedPosts(
          postsData.map((p) => ({
            id: p.id,
            likes_count: p.likes_count,
            comments_count: p.comments_count,
            media: ((p.media as unknown as { type: 'image' | 'video'; url: string; position: number }[]) || [])
              .sort((a, b) => a.position - b.position)
              .map((m) => ({ type: m.type, url: m.url })),
          }))
        );
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'saved' && isOwnPet) loadBookmarks();
  }, [activeTab]);

  const handleFollow = async () => {
    if (!currentPet) return;
    try {
      if (followStatus === 'accepted') {
        // Unfollow
        await supabase.from('follows').delete().eq('follower_id', currentPet.id).eq('following_id', petId);
        setFollowStatus('none');
        if (pet) setPet({ ...pet, followers_count: pet.followers_count - 1 });
      } else if (followStatus === 'pending') {
        // Cancel pending request
        await supabase.from('follows').delete().eq('follower_id', currentPet.id).eq('following_id', petId);
        setFollowStatus('none');
      } else {
        // Send follow request (pending)
        await supabase.from('follows').insert({ follower_id: currentPet.id, following_id: petId, status: 'pending' });
        setFollowStatus('pending');
        toast.success('Solicitud enviada');
      }
    } catch {
      toast.error('Error al seguir');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!pet) {
    return (
      <EmptyState
        icon={Camera}
        title="Mascota no encontrada"
        description="Esta mascota no existe o ha sido eliminada."
        actionLabel="Volver al feed"
        actionHref="/feed"
      />
    );
  }

  // blocked by privacy
  const isOwnPet = pet.owner_id === user?.id;
  if (pet.is_private && !isOwnPet && followStatus !== 'accepted') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
        <Avatar src={pet.avatar_url} alt={pet.name} size="2xl" className="mx-auto" />
        <h1 className="text-2xl font-bold">{pet.name}</h1>
        <p className="text-gray-500">Este perfil es privado.</p>
        {followStatus === 'none' && (
          <button
            onClick={handleFollow}
            className="btn-primary px-6 py-2 rounded-lg"
          >
            Seguir
          </button>
        )}
        {followStatus === 'pending' && <p className="text-sm text-gray-500">Solicitud enviada</p>}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cover */}
      <div className="relative h-32 md:h-48 bg-gradient-to-r from-primary-400 to-primary-600 rounded-t-xl overflow-hidden">
        {pet.cover_url && (
          <img src={pet.cover_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile header */}
      <div className="px-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
          <Avatar src={pet.avatar_url} alt={pet.name} size="2xl" className="ring-4 ring-white dark:ring-gray-950" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {pet.name}
              {isOwnPet && pet.is_private && (
                <span className="text-sm text-gray-500 ml-2">🔒 Privado</span>
              )}
            </h1>
            <p className="text-gray-500 text-sm">
              {speciesLabels[pet.species] || pet.species}
              {pet.breed && ` · ${pet.breed}`}
            </p>
          </div>
          <div className="flex gap-2">
            {isOwnPet ? (
              <Link href={`/pets/${pet.id}/edit`} className="btn-outline text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Editar perfil
              </Link>
            ) : (
              <button
                onClick={handleFollow}
                className={cn(
                  'text-sm px-6 py-2 rounded-lg font-medium',
                  followStatus === 'accepted' ? 'btn-outline' :
                  followStatus === 'pending' ? 'btn-outline text-amber-600 border-amber-300 dark:border-amber-700' :
                  'btn-primary'
                )}
              >
                {followStatus === 'accepted' ? 'Siguiendo' :
                 followStatus === 'pending' ? 'Solicitud enviada' :
                 'Seguir'}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4 py-3">
          <div className="text-center">
            <p className="font-bold">{formatNumber(pet.posts_count)}</p>
            <p className="text-xs text-gray-500">Publicaciones</p>
          </div>
          <div className="text-center">
            <p className="font-bold">{formatNumber(pet.followers_count)}</p>
            <p className="text-xs text-gray-500">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="font-bold">{formatNumber(pet.following_count)}</p>
            <p className="text-xs text-gray-500">Siguiendo</p>
          </div>
        </div>

        {/* Bio */}
        {pet.bio && <p className="text-sm mt-2">{pet.bio}</p>}
        {(pet.city || pet.country) && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {[pet.city, pet.country].filter(Boolean).join(', ')}
          </p>
        )}
        {pet.birth_date && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(pet.birth_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-200 dark:border-gray-800 flex">
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors',
            activeTab === 'posts'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Grid3X3 className="w-4 h-4" />
          Publicaciones
        </button>
        {isOwnPet && (
          <button
            onClick={() => setActiveTab('saved')}
            className={cn(
              'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors',
              activeTab === 'saved'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Bookmark className="w-4 h-4" />
            Guardados
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mt-1">
        {activeTab === 'posts' && (
          posts.length > 0 ? (
            <PostGrid posts={posts} />
          ) : (
            <EmptyState
              icon={Camera}
              title="Sin publicaciones"
              description={isOwnPet ? 'Crea tu primera publicación' : 'Esta mascota aún no tiene publicaciones'}
              actionLabel={isOwnPet ? 'Crear publicación' : undefined}
              actionHref={isOwnPet ? '/create' : undefined}
            />
          )
        )}
        {activeTab === 'saved' && (
          bookmarkedPosts.length > 0 ? (
            <PostGrid posts={bookmarkedPosts} />
          ) : (
            <EmptyState
              icon={Bookmark}
              title="Sin guardados"
              description="Los posts que guardes aparecerán aquí"
            />
          )
        )}
      </div>
    </div>
  );
}
