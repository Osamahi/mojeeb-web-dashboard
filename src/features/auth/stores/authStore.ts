import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth.types';
import { setTokens as setApiTokens, clearTokens as clearApiTokens } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) => {
        setApiTokens(accessToken, refreshToken);
        set({ accessToken, refreshToken });
      },

      setAuth: (user, accessToken, refreshToken) => {
        setApiTokens(accessToken, refreshToken);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        clearApiTokens();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'mojeeb-auth-storage',
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore tokens to API client on page reload
        if (state?.refreshToken && state?.user) {
          // We don't have access token on reload, but refresh token will be used automatically
          state.isAuthenticated = true;
        }
      },
    }
  )
);
