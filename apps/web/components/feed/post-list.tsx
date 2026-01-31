'use client';

import { useState } from 'react';
import { PostCard } from './post-card';

// TODO: Replace with API call and infinite scroll
const mockPosts = [
  {
    id: '1',
    pet: {
      id: 'p1',
      name: 'Luna',
      avatarUrl: null,
      species: 'Perro',
    },
    caption:
      'Disfrutando del parque en esta hermosa tarde soleada! 🌞🐕 #DogsOfPetSocial #ParkLife',
    media: [
      {
        id: 'm1',
        type: 'image' as const,
        url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
        width: 800,
        height: 1000,
      },
    ],
    likesCount: 234,
    commentsCount: 18,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
  },
  {
    id: '2',
    pet: {
      id: 'p2',
      name: 'Michi',
      avatarUrl: null,
      species: 'Gato',
    },
    caption: 'Mi lugar favorito para dormir la siesta 😸💤',
    media: [
      {
        id: 'm2',
        type: 'image' as const,
        url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
        width: 800,
        height: 800,
      },
    ],
    likesCount: 567,
    commentsCount: 42,
    isLiked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    pet: {
      id: 'p3',
      name: 'Rocky',
      avatarUrl: null,
      species: 'Perro',
    },
    caption:
      'Nuevo corte de pelo, ¿qué les parece? 💇‍♂️✨ Mi humano dice que parezco un osito',
    media: [
      {
        id: 'm3',
        type: 'image' as const,
        url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
        width: 800,
        height: 600,
      },
      {
        id: 'm4',
        type: 'image' as const,
        url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800',
        width: 800,
        height: 600,
      },
    ],
    likesCount: 891,
    commentsCount: 67,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
];

export function PostList() {
  const [posts, setPosts] = useState(mockPosts);

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likesCount: post.isLiked
                ? post.likesCount - 1
                : post.likesCount + 1,
            }
          : post
      )
    );
  };

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={() => handleLike(post.id)}
        />
      ))}

      {/* Load more indicator */}
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-gray-400">Cargando más posts...</div>
      </div>
    </div>
  );
}
