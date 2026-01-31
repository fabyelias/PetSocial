'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';

// TODO: Fetch from API
const suggestedPets = [
  {
    id: '1',
    name: 'Luna',
    species: 'Perro',
    breed: 'Golden Retriever',
    avatarUrl: null,
    mutualFollowers: 3,
  },
  {
    id: '2',
    name: 'Michi',
    species: 'Gato',
    breed: 'Siamés',
    avatarUrl: null,
    mutualFollowers: 5,
  },
  {
    id: '3',
    name: 'Rocky',
    species: 'Perro',
    breed: 'Bulldog',
    avatarUrl: null,
    mutualFollowers: 2,
  },
];

const trendingTags = [
  { tag: '#DogsOfPetSocial', posts: '12.5K' },
  { tag: '#CatLife', posts: '8.3K' },
  { tag: '#PetFitness', posts: '5.1K' },
  { tag: '#AdoptDontShop', posts: '15.2K' },
];

export function RightSidebar() {
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
                <Avatar src={pet.avatarUrl} alt={pet.name} size="md" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/pet/${pet.id}`}
                  className="font-medium text-sm hover:underline truncate block"
                >
                  {pet.name}
                </Link>
                <p className="text-xs text-gray-500 truncate">
                  {pet.breed} · {pet.mutualFollowers} amigos en común
                </p>
              </div>
              <button className="text-xs font-semibold text-primary-600 hover:text-primary-500">
                Seguir
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending */}
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
