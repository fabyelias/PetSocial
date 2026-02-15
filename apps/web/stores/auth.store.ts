import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type PetRow = Database['public']['Tables']['pets']['Row'];

// Types
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: 'user' | 'moderator' | 'admin';
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

interface AuthState {
  // State
  user: User | null;
  pets: Pet[];
  currentPetId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Computed
  currentPet: Pet | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setCurrentPet: (petId: string) => void;
  addPet: (pet: Pet) => void;
  updatePet: (petId: string, data: Partial<Pet>) => void;
}

// Helper: cargar perfil desde Supabase
async function loadProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const profile = data as ProfileRow;
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    role: profile.role,
    status: profile.status,
    emailVerifiedAt: profile.email_verified_at,
    createdAt: profile.created_at,
  };
}

// Helper: cargar mascotas desde Supabase
async function loadPets(userId: string): Promise<Pet[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return (data as PetRow[]).map((p) => ({
    id: p.id,
    name: p.name,
    species: p.species,
    breed: p.breed,
    avatarUrl: p.avatar_url,
    followersCount: p.followers_count,
    followingCount: p.following_count,
    postsCount: p.posts_count,
  }));
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      pets: [],
      currentPetId: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      // Computed
      get currentPet() {
        const { pets, currentPetId } = get();
        return pets.find((p) => p.id === currentPetId) || pets[0] || null;
      },

      // Initialize: verificar sesión de Supabase y cargar datos
      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });

        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (!session?.user) {
            set({ isInitialized: true, isLoading: false });
            return;
          }

          const [user, pets] = await Promise.all([
            loadProfile(session.user.id),
            loadPets(session.user.id),
          ]);

          const savedPetId = localStorage.getItem('petsocial_current_pet');
          const currentPetId = pets.find((p) => p.id === savedPetId)?.id || pets[0]?.id || null;

          set({
            user,
            pets,
            currentPetId,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
          });
        } catch {
          set({
            user: null,
            pets: [],
            currentPetId: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
          });
        }
      },

      // Login con Supabase Auth
      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw new Error(error.message);

          const [user, pets] = await Promise.all([
            loadProfile(data.user.id),
            loadPets(data.user.id),
          ]);

          const currentPetId = pets[0]?.id || null;

          set({
            user,
            pets,
            currentPetId,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Register con Supabase Auth
      register: async (email: string, password: string, displayName?: string) => {
        set({ isLoading: true });

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName || email.split('@')[0],
              },
            },
          });

          if (error) throw new Error(error.message);
          if (!data.user) throw new Error('Error al crear la cuenta');

          // El trigger handle_new_user() crea el perfil automáticamente
          await new Promise((resolve) => setTimeout(resolve, 500));

          const user = await loadProfile(data.user.id);

          set({
            user,
            pets: [],
            currentPetId: null,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } finally {
          localStorage.removeItem('petsocial_current_pet');
          set({
            user: null,
            pets: [],
            currentPetId: null,
            isAuthenticated: false,
          });
        }
      },

      // Refresh user data
      refreshUser: async () => {
        if (!get().isAuthenticated) return;

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            get().logout();
            return;
          }

          const [user, pets] = await Promise.all([
            loadProfile(session.user.id),
            loadPets(session.user.id),
          ]);

          set((state) => ({
            user,
            pets,
            currentPetId: pets.find((p) => p.id === state.currentPetId)?.id || pets[0]?.id || null,
          }));
        } catch {
          get().logout();
        }
      },

      // Set current pet
      setCurrentPet: (petId: string) => {
        const pet = get().pets.find((p) => p.id === petId);
        if (pet) {
          localStorage.setItem('petsocial_current_pet', petId);
          set({ currentPetId: petId });
        }
      },

      // Add new pet
      addPet: (pet: Pet) => {
        set((state) => ({
          pets: [...state.pets, pet],
          currentPetId: state.currentPetId || pet.id,
        }));
      },

      // Update pet
      updatePet: (petId: string, data: Partial<Pet>) => {
        set((state) => ({
          pets: state.pets.map((p) => (p.id === petId ? { ...p, ...data } : p)),
        }));
      },
    }),
    { name: 'auth-store' }
  )
);

// Escuchar cambios de sesión de Supabase
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      useAuthStore.setState({
        user: null,
        pets: [],
        currentPetId: null,
        isAuthenticated: false,
      });
    }
  });
}

// Selector hooks para optimizar renders
export const useUser = () => useAuthStore((state) => state.user);
export const usePets = () => useAuthStore((state) => state.pets);
export const useCurrentPet = () => {
  const pets = useAuthStore((state) => state.pets);
  const currentPetId = useAuthStore((state) => state.currentPetId);
  return pets.find((p) => p.id === currentPetId) || pets[0] || null;
};
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAuthLoading = () => useAuthStore((state) => state.isLoading);
