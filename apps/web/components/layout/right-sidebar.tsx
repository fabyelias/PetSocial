'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useCurrentPet, useUser } from '@/stores/auth.store';
import { formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';

const speciesLabels: Record<string, string> = {
  dog: 'Perro', cat: 'Gato', bird: 'Ave', rabbit: 'Conejo',
  hamster: 'Hamster', fish: 'Pez', reptile: 'Reptil', other: 'Otro',
};

interface SuggestedPet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  avatar_url: string | null;
  followers_count: number;
}

export function RightSidebar() {
  const currentPet = useCurrentPet();
  const user = useUser();
  const [suggestedPets, setSuggestedPets] = useState<SuggestedPet[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [trendingTags, setTrendingTags] = useState<{ tag: string; posts: number }[]>([]);

  useEffect(() => {
    if (!currentPet || !user) return;

    // Fetch who current pet is already following
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentPet.id)
      .then(({ data }) => {
        if (data) setFollowingIds(new Set(data.map((f) => f.following_id)));
      });

    supabase
      .from('pets')
      .select('id, name, species, breed, avatar_url, followers_count')
      .neq('owner_id', user.id)
      .eq('is_active', true)
      .order('followers_count', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setSuggestedPets(data);
      });

    // Fetch trending tags from recent posts
    supabase
      .from('posts')
      .select('caption')
      .eq('visibility', 'public')
      .not('caption', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!data) return;
        const tagCounts: Record<string, number> = {};
        data.forEach((p) => {
          const matches = p.caption?.match(/#\w+/g);
          if (matches) matches.forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
        });
        const sorted = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, posts]) => ({ tag, posts }));
        setTrendingTags(sorted);
      });
  }, [currentPet?.id, user?.id]);

  const handleFollow = async (petId: string) => {
    if (!currentPet) return;
    try {
      if (followingIds.has(petId)) {
        await supabase.from('follows').delete().eq('follower_id', currentPet.id).eq('following_id', petId);
        setFollowingIds((prev) => { const s = new Set(prev); s.delete(petId); return s; });
      } else {
        await supabase.from('follows').insert({ follower_id: currentPet.id, following_id: petId });
        setFollowingIds((prev) => new Set(prev).add(petId));
      }
    } catch {
      toast.error('Error al seguir');
    }
  };
  return (
    <aside className="fixed right-0 top-0 h-screen w-80 p-6 overflow-y-auto">
      {/* Suggested pets */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500">
            Sugeridos para ti
          </h3>
          <Link
            href="/explore/pets"
            className="text-xs text-primary-600 hover:text-primary-500 font-medium"
          >
            Ver todos
          </Link>
        </div>

        <div className="space-y-4">
          {suggestedPets.map((pet) => (
            <div key={pet.id} className="flex items-center gap-3">
              <Link href={`/pet/${pet.id}`}>
                <Avatar src={pet.avatar_url} alt={pet.name} size="md" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/pet/${pet.id}`}
                  className="font-medium text-sm hover:underline truncate block"
                >
                  {pet.name}
                </Link>
                <p className="text-xs text-gray-500 truncate">
                  {speciesLabels[pet.species] || pet.species}
                  {pet.breed && ` · ${pet.breed}`}
                </p>
              </div>
              <button
                onClick={() => handleFollow(pet.id)}
                className="text-xs font-semibold text-primary-600 hover:text-primary-500"
              >
                {followingIds.has(pet.id) ? 'Siguiendo' : 'Seguir'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending */}
      {trendingTags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">Tendencias</h3>
          <div className="space-y-3">
            {trendingTags.map((item) => (
              <Link
                key={item.tag}
                href={`/explore/tags/${item.tag.slice(1)}`}
                className="block hover:bg-gray-100 dark:hover:bg-gray-900 -mx-2 px-2 py-1.5 rounded-lg"
              >
                <div className="font-medium text-sm">{item.tag}</div>
                <div className="text-xs text-gray-500">{item.posts} publicaciones</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer links */}
      <div className="text-xs text-gray-400 space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link href="/about" className="hover:underline">
            Acerca de
          </Link>
          <Link href="/help" className="hover:underline">
            Ayuda
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacidad
          </Link>
          <Link href="/terms" className="hover:underline">
            Términos
          </Link>
        </div>
        <p>© 2026 PetSocial</p>
      </div>
    </aside>
  );
}
