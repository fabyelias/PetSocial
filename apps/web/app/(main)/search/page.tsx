'use client';

import { useState, useEffect } from 'react';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/avatar';
import { PostGrid } from '@/components/pet/post-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { formatNumber, cn } from '@/lib/utils';

const speciesLabels: Record<string, string> = {
  dog: 'Perro', cat: 'Gato', bird: 'Ave', rabbit: 'Conejo',
  hamster: 'Hamster', fish: 'Pez', reptile: 'Reptil', other: 'Otro',
};

interface SearchPet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  avatar_url: string | null;
  followers_count: number;
}

interface SearchPost {
  id: string;
  likes_count: number;
  comments_count: number;
  media: { type: 'image' | 'video'; url: string }[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pets' | 'posts'>('pets');
  const [pets, setPets] = useState<SearchPet[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setPets([]);
      setPosts([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);

      if (activeTab === 'pets') {
        const { data } = await supabase
          .from('pets')
          .select('id, name, species, breed, avatar_url, followers_count')
          .or(`name.ilike.%${query}%,breed.ilike.%${query}%`)
          .eq('is_active', true)
          .order('followers_count', { ascending: false })
          .limit(20);
        setPets(data || []);
      } else {
        const { data } = await supabase
          .from('posts')
          .select(`
            id, likes_count, comments_count,
            media:post_media(type, url, position)
          `)
          .ilike('caption', `%${query}%`)
          .eq('is_hidden', false)
          .eq('visibility', 'public')
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
      }

      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, activeTab]);

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar mascotas o publicaciones..."
          className="input pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['pets', 'posts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeTab === tab
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            )}
          >
            {tab === 'pets' ? 'Mascotas' : 'Publicaciones'}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : query.length < 2 ? (
        <EmptyState
          icon={SearchIcon}
          title="Buscar en PetSocial"
          description="Escribe al menos 2 caracteres para buscar"
        />
      ) : activeTab === 'pets' ? (
        pets.length > 0 ? (
          <div className="space-y-3">
            {pets.map((pet) => (
              <Link
                key={pet.id}
                href={`/pet/${pet.id}`}
                className="card p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors block"
              >
                <Avatar src={pet.avatar_url} alt={pet.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{pet.name}</p>
                  <p className="text-xs text-gray-500">
                    {speciesLabels[pet.species] || pet.species}
                    {pet.breed && ` · ${pet.breed}`}
                    {' · '}{formatNumber(pet.followers_count)} seguidores
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={SearchIcon}
            title="Sin resultados"
            description={`No se encontraron mascotas para "${query}"`}
          />
        )
      ) : posts.length > 0 ? (
        <PostGrid posts={posts} />
      ) : (
        <EmptyState
          icon={SearchIcon}
          title="Sin resultados"
          description={`No se encontraron publicaciones para "${query}"`}
        />
      )}
    </div>
  );
}
