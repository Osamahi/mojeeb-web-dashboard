import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types/auth.types';
import { setTokens as storeTokens, clearTokens as clearStoredTokens } from '@/lib/tokenStore';
import { setSentryUser } from '@/lib/sentry';
import { identifyClarityUser } from '@/lib/clarity';

/**
 * Auth store.
 *
 * Shape (load-bearing for ~40 consumer files — do not change lightly):
 *   user, accessToken, refreshToken, isAuthenticated, isLoading
 *
 * What's persisted to localStorage under 'mojeeb-auth-storage':
 *   user, refreshToken, isAuthenticated
 * (accessToken stays in memory only — it's re-derived on page load by
 *  AuthInitializer calling /refresh.)
 *
 * The refreshToken is ALSO persisted to a separate key 'mojeeb.refreshToken'
 * by tokenStore — that's the value the axios interceptor reads. The store's
 * copy is the signal route guards use ("do we have a session?"); the
 * tokenStore copy is what actually gets sent to /refresh. They're kept in
 * sync by setTokens / setAuth / logout.
 */

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
  updateUserPhone: (phone: string) => void;
  logout: (options?: { redirect?: boolean; reason?: string }) => Promise<void>;
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
        storeTokens(accessToken, refreshToken);
        set({ accessToken, refreshToken });
      },

      setAuth: (user, accessToken, refreshToken) => {
        storeTokens(accessToken, refreshToken);
        setSentryUser(user.id, user.email, user.name);
        identifyClarityUser(user.id);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });

        // Re-initialize logout listener (may have been closed during a previous
        // logout). Dynamic import avoids a circular dependency.
        import('./../../auth/services/logoutService').then(({ initializeLogoutListener }) => {
          initializeLogoutListener();
        });
      },

      updateUserPhone: (phone) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, phone } });
        }
      },

      /**
       * Logout. Delegates to the centralized logoutService — do NOT add
       * cleanup logic here.
       */
      logout: async (options?: { redirect?: boolean; reason?: string }) => {
        const { performLogout } = await import('./../../auth/services/logoutService');
        await performLogout({
          callBackend: true,
          redirect: options?.redirect !== false,
          reason: options?.reason || 'user-initiated',
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'mojeeb-auth-storage',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return localStorage.getItem(name);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, value);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('[authStore.persist] setItem error', error);
            }
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // ignore
          }
        },
      })),
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return;

          // Skip auth rehydration in the OAuth popup. The popup loads the full
          // React app at /oauth/callback; if we refreshed the token here we'd
          // invalidate the parent window's session. The popup's job is to
          // receive the OAuth code and post it back, not to be authenticated.
          if (window.location.pathname === '/oauth/callback') {
            state.isAuthenticated = false;
            return;
          }

          // Keep tokenStore in sync with whatever the rehydrated refresh token is.
          // (tokenStore's migration-on-boot already picked up the legacy plain
          // 'refreshToken' key, so in the common case this is a no-op. But if a
          // user had state in 'mojeeb-auth-storage' but not in the legacy key,
          // this ensures tokenStore has it for the upcoming /refresh call.)
          if (state.refreshToken) {
            // Only write to localStorage, not to accessToken — we intentionally
            // don't have an access token after rehydration; AuthInitializer will
            // fetch one via /refresh.
            try {
              localStorage.setItem('mojeeb.refreshToken', state.refreshToken);
            } catch {
              // ignore
            }
          }

          // If rehydrated state says "authenticated" but has no refresh token,
          // that's corrupted state — reset to logged-out.
          if (state.isAuthenticated && !state.refreshToken) {
            state.isAuthenticated = false;
            state.user = null;
          }

          // No async validation here. The axios interceptor will surface
          // expired/revoked refresh tokens as 401s from /refresh, and
          // AuthInitializer handles the refresh-on-mount flow. Removing the
          // rehydration-time validation eliminates a whole class of race
          // conditions (the old retry loop, SCENARIO_C diagnostics, etc).
        };
      },
    }
  )
);
