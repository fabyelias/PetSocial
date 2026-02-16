'use client';

import { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import { PetCard } from '@/components/pet/pet-card';
import { EmptyState } from '@/components/ui/empty-state';
import { useCurrentPet } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const speciesFilters = [
  { value: '', label: 'Todos' },
  { value: 'dog', label: 'Perros' },
  { value: 'cat', label: 'Gatos' },
  { value: 'bird', label: 'Aves' },
  { value: 'rabbit', label: 'Conejos' },
  { value: 'hamster', label: 'Hamsters' },
  { value: 'fish', label: 'Peces' },
  { value: 'reptile', label: 'Reptiles' },
  { value: 'other', label: 'Otros' },
];

interface PetItem {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
}

export default function ExplorePetsPage() {
  const currentPet = useCurrentPet();
  const [pets, setPets] = useState<PetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      let query = supabase
        .from('pets')
        .select('id, name, species, breed, avatar_url, bio, followers_count')
        .eq('is_active', true)
        .order('followers_count', { ascending: false })
        .limit(30);

      if (speciesFilter) {
        query = query.eq('species', speciesFilter as Database['public']['Enums']['pet_species']);
      }

      const { data } = await query;
      setPets(data || []);

      if (currentPet) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentPet.id);
        if (follows) setFollowingIds(new Set(follows.map((f) => f.following_id)));
      }

      setIsLoading(false);
    }
    load();
  }, [speciesFilter, currentPet?.id]);

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
    <div>
      <h1 className="text-2xl font-bold mb-4">Descubrir mascotas</h1>

      {/* Species filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
        {speciesFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSpeciesFilter(filter.value)}
            className={cn(
              'px-4 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors',
              speciesFilter === filter.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : pets.length > 0 ? (
        <div className="space-y-3">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onFollow={() => handleFollow(pet.id)}
              isFollowing={followingIds.has(pet.id)}
              showFollowButton={currentPet?.id !== pet.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No se encontraron mascotas"
          description="No hay mascotas con este filtro"
        />
      )}
    </div>
  );
}
