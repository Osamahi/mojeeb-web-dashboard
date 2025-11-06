import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth.types';
import { setTokens as setApiTokens, clearTokens as clearApiTokens } from '@/lib/tokenManager';

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
        // Critical fix for flickering loop: Validate accessToken exists before setting isAuthenticated
        if (state?.refreshToken && state?.user) {
          const accessToken = localStorage.getItem('accessToken');

          // Only set isAuthenticated if we have BOTH tokens
          if (accessToken && accessToken.trim() !== '') {
            state.isAuthenticated = true;
          } else {
            // Has refresh token but no access token - trigger auth flow
            state.isAuthenticated = false;
          }
        } else {
          // No refresh token or user - definitely not authenticated
          state.isAuthenticated = false;
        }
      },
    }
  )
);
