import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface FeedPost {
  id: string;
  pet: {
    id: string;
    name: string;
    avatarUrl: string | null;
    species: string;
  };
  caption: string;
  media: {
    id: string;
    type: 'image' | 'video';
    url: string;
    width: number;
    height: number;
  }[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

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

interface FeedState {
  posts: FeedPost[];
  isLoading: boolean;
  hasMore: boolean;

  fetchFeed: (currentPetId: string) => Promise<void>;
  fetchMorePosts: (currentPetId: string) => Promise<void>;
  toggleLike: (postId: string, petId: string) => Promise<void>;
  toggleBookmark: (postId: string, petId: string) => Promise<void>;
  addComment: (postId: string, petId: string, content: string) => Promise<void>;
  reset: () => void;
}

export const useFeedStore = create<FeedState>()((set, get) => ({
  posts: [],
  isLoading: false,
  hasMore: true,

  fetchFeed: async (currentPetId: string) => {
    set({ isLoading: true });

    try {
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          pet:pets!pet_id(id, name, species, avatar_url),
          media:post_media(id, type, url, width, height, position)
        `)
        .eq('is_hidden', false)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!postsData || postsData.length === 0) {
        set({ posts: [], isLoading: false, hasMore: false });
        return;
      }

      const postIds = postsData.map((p) => p.id);

      const [{ data: likedPosts }, { data: bookmarkedPosts }] = await Promise.all([
        supabase
          .from('likes')
          .select('post_id')
          .eq('pet_id', currentPetId)
          .in('post_id', postIds),
        supabase
          .from('bookmarks')
          .select('post_id')
          .eq('pet_id', currentPetId)
          .in('post_id', postIds),
      ]);

      const likedSet = new Set(likedPosts?.map((l) => l.post_id) || []);
      const bookmarkedSet = new Set(bookmarkedPosts?.map((b) => b.post_id) || []);

      const posts: FeedPost[] = postsData.map((p) => {
        const pet = p.pet as unknown as { id: string; name: string; species: string; avatar_url: string | null };
        const media = (p.media as unknown as { id: string; type: 'image' | 'video'; url: string; width: number | null; height: number | null; position: number }[]) || [];

        return {
          id: p.id,
          pet: {
            id: pet.id,
            name: pet.name,
            avatarUrl: pet.avatar_url,
            species: speciesLabels[pet.species] || pet.species,
          },
          caption: p.caption || '',
          media: media
            .sort((a, b) => a.position - b.position)
            .map((m) => ({
              id: m.id,
              type: m.type,
              url: m.url,
              width: m.width || 800,
              height: m.height || 800,
            })),
          likesCount: p.likes_count,
          commentsCount: p.comments_count,
          isLiked: likedSet.has(p.id),
          isBookmarked: bookmarkedSet.has(p.id),
          createdAt: p.created_at,
        };
      });

      set({ posts, isLoading: false, hasMore: postsData.length === 20 });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMorePosts: async (currentPetId: string) => {
    const { posts, hasMore, isLoading } = get();
    if (!hasMore || isLoading || posts.length === 0) return;

    set({ isLoading: true });
    const lastPost = posts[posts.length - 1];

    try {
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          pet:pets!pet_id(id, name, species, avatar_url),
          media:post_media(id, type, url, width, height, position)
        `)
        .eq('is_hidden', false)
        .eq('visibility', 'public')
        .lt('created_at', lastPost.createdAt)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!postsData || postsData.length === 0) {
        set({ isLoading: false, hasMore: false });
        return;
      }

      const postIds = postsData.map((p) => p.id);

      const [{ data: likedPosts }, { data: bookmarkedPosts }] = await Promise.all([
        supabase.from('likes').select('post_id').eq('pet_id', currentPetId).in('post_id', postIds),
        supabase.from('bookmarks').select('post_id').eq('pet_id', currentPetId).in('post_id', postIds),
      ]);

      const likedSet = new Set(likedPosts?.map((l) => l.post_id) || []);
      const bookmarkedSet = new Set(bookmarkedPosts?.map((b) => b.post_id) || []);

      const newPosts: FeedPost[] = postsData.map((p) => {
        const pet = p.pet as unknown as { id: string; name: string; species: string; avatar_url: string | null };
        const media = (p.media as unknown as { id: string; type: 'image' | 'video'; url: string; width: number | null; height: number | null; position: number }[]) || [];

        return {
          id: p.id,
          pet: {
            id: pet.id,
            name: pet.name,
            avatarUrl: pet.avatar_url,
            species: speciesLabels[pet.species] || pet.species,
          },
          caption: p.caption || '',
          media: media
            .sort((a, b) => a.position - b.position)
            .map((m) => ({
              id: m.id,
              type: m.type,
              url: m.url,
              width: m.width || 800,
              height: m.height || 800,
            })),
          likesCount: p.likes_count,
          commentsCount: p.comments_count,
          isLiked: likedSet.has(p.id),
          isBookmarked: bookmarkedSet.has(p.id),
          createdAt: p.created_at,
        };
      });

      set({
        posts: [...posts, ...newPosts],
        isLoading: false,
        hasMore: postsData.length === 20,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  toggleLike: async (postId: string, petId: string) => {
    const { posts } = get();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasLiked = post.isLiked;

    set({
      posts: posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !wasLiked,
              likesCount: wasLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      ),
    });

    try {
      if (wasLiked) {
        await supabase.from('likes').delete().eq('pet_id', petId).eq('post_id', postId);
      } else {
        await supabase.from('likes').insert({ pet_id: petId, post_id: postId });
      }
    } catch {
      set({
        posts: get().posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: wasLiked,
                likesCount: wasLiked ? p.likesCount + 1 : p.likesCount - 1,
              }
            : p
        ),
      });
    }
  },

  toggleBookmark: async (postId: string, petId: string) => {
    const { posts } = get();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasBookmarked = post.isBookmarked;

    set({
      posts: posts.map((p) =>
        p.id === postId ? { ...p, isBookmarked: !wasBookmarked } : p
      ),
    });

    try {
      if (wasBookmarked) {
        await supabase.from('bookmarks').delete().eq('pet_id', petId).eq('post_id', postId);
      } else {
        await supabase.from('bookmarks').insert({ pet_id: petId, post_id: postId });
      }
    } catch {
      set({
        posts: get().posts.map((p) =>
          p.id === postId ? { ...p, isBookmarked: wasBookmarked } : p
        ),
      });
    }
  },

  addComment: async (postId: string, petId: string, content: string) => {
    try {
      await supabase.from('comments').insert({
        post_id: postId,
        pet_id: petId,
        content,
      });

      set({
        posts: get().posts.map((p) =>
          p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
        ),
      });
    } catch {
      // silently fail
    }
  },

  reset: () => set({ posts: [], isLoading: false, hasMore: true }),
}));
