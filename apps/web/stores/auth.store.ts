import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient, api } from '@/lib/api/client';
import { setTokens, clearTokens, getTokens, hasValidTokens } from '@/lib/auth/tokens';

// Types
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: 'user' | 'moderator' | 'admin';
  status: 'pending' | 'active' | 'suspended';
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

      // Initialize: verificar tokens y cargar usuario
      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });

        try {
          if (!hasValidTokens()) {
            set({ isInitialized: true, isLoading: false });
            return;
          }

          // Cargar usuario y mascotas
          const [user, pets] = await Promise.all([
            api<User>(apiClient.get('/users/me')),
            api<Pet[]>(apiClient.get('/pets/me')),
          ]);

          // Recuperar mascota seleccionada del storage
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
        } catch (error) {
          // Token inválido o expirado
          clearTokens();
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

      // Login
      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          const response = await api<{
            user: User;
            pets: Pet[];
            accessToken: string;
            refreshToken: string;
          }>(apiClient.post('/auth/login', { email, password }));

          setTokens(response.accessToken, response.refreshToken);

          const currentPetId = response.pets[0]?.id || null;

          set({
            user: response.user,
            pets: response.pets,
            currentPetId,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Register
      register: async (email: string, password: string, displayName?: string) => {
        set({ isLoading: true });

        try {
          const response = await api<{
            user: User;
            accessToken: string;
            refreshToken: string;
          }>(apiClient.post('/auth/register', { email, password, displayName }));

          setTokens(response.accessToken, response.refreshToken);

          set({
            user: response.user,
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
          const { refreshToken } = getTokens();
          if (refreshToken) {
            await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
          }
        } finally {
          clearTokens();
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
          const [user, pets] = await Promise.all([
            api<User>(apiClient.get('/users/me')),
            api<Pet[]>(apiClient.get('/pets/me')),
          ]);

          set((state) => ({
            user,
            pets,
            currentPetId: pets.find((p) => p.id === state.currentPetId)?.id || pets[0]?.id || null,
          }));
        } catch (error) {
          // Si falla, probablemente el token expiró
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
