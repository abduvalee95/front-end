import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  organization_id?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  setAuth: (user: User) => void;
  logout: () => void;
  setHydrated: () => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      isLoading: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setHydrated: () => set({ isHydrated: true }),
      setLoading: (isLoading) => set({ isLoading }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
