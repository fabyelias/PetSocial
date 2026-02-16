'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { formatNumber } from '@/lib/utils';

const speciesLabels: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  rabbit: 'Conejo',
  hamster: 'Hamster',
  fish: 'Pez',
  reptile: 'Reptil',
  other: 'Otro',
};

interface PetCardProps {
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    avatar_url: string | null;
    bio: string | null;
    followers_count: number;
  };
  onFollow?: () => void;
  showFollowButton?: boolean;
  isFollowing?: boolean;
}

export function PetCard({ pet, onFollow, showFollowButton = true, isFollowing = false }: PetCardProps) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <Link href={`/pet/${pet.id}`}>
        <Avatar src={pet.avatar_url} alt={pet.name} size="lg" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/pet/${pet.id}`}
          className="font-semibold text-sm hover:underline block truncate"
        >
          {pet.name}
        </Link>
        <p className="text-xs text-gray-500 truncate">
          {speciesLabels[pet.species] || pet.species}
          {pet.breed && ` · ${pet.breed}`}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatNumber(pet.followers_count)} seguidores
        </p>
      </div>
      {showFollowButton && onFollow && (
        <button
          onClick={onFollow}
          className={
            isFollowing
              ? 'btn-outline text-xs px-4 py-1.5 rounded-lg'
              : 'btn-primary text-xs px-4 py-1.5 rounded-lg'
          }
        >
          {isFollowing ? 'Siguiendo' : 'Seguir'}
        </button>
      )}
    </div>
  );
}
