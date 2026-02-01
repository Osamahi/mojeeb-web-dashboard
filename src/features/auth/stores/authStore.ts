import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types/auth.types';
import { setTokens as setApiTokens, clearTokens as clearApiTokens } from '@/lib/tokenManager';
import { setSentryUser, clearSentryUser } from '@/lib/sentry';
import { identifyClarityUser, clearClarityUser } from '@/lib/clarity';
import { sessionHelper } from '@/lib/sessionHelper';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';
import { runStorageHealthCheck, quickStorageCheck } from '@/lib/storageHealthCheck';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { usePlanStore } from '@/features/subscriptions/stores/planStore';

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

// CRITICAL: In Zustand v5, persist configuration must be passed directly to persist middleware.
// The subscribeWithSelector wrapper was causing the config object to be misplaced,
// preventing persist from knowing where/how to save data to localStorage.
// We use a manual subscriber at the bottom of the file instead (line 253).
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

        // Set Sentry user context for error tracking
        setSentryUser(user.id, user.email, user.name);

        // Set Clarity user identification for session tracking (privacy: use ID only, not email)
        identifyClarityUser(user.id);

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });

        // Start proactive token refresh service
        import('./../../auth/services/tokenRefreshService').then(({ tokenRefreshService }) => {
          tokenRefreshService.start();
        });

        // Re-initialize logout listener (may have been closed during previous logout)
        import('./../../auth/services/logoutService').then(({ initializeLogoutListener }) => {
          initializeLogoutListener();
        });

        // NOTE: Invitation checking is now handled by usePostAuthNavigation hook
        // (called after auth methods in LoginPage, SignUpPage, GoogleCallbackPage)
        // This ensures invitations are checked in a unified way with proper navigation
      },

      updateUserPhone: (phone) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, phone } });
        }
      },

      /**
       * Logout the current user
       *
       * IMPORTANT: This method now delegates to the centralized logoutService
       * for consistent, secure logout behavior across all logout paths.
       *
       * Do NOT add cleanup logic here - use logoutService instead.
       *
       * @param options - Optional logout configuration
       */
      logout: async (options?: { redirect?: boolean; reason?: string }) => {
        // DIAGNOSTIC: Log logout trigger
        if (import.meta.env.DEV) {
          const logoutStack = new Error().stack;
          console.log(`\n🚪 [AuthStore] logout called at ${new Date().toISOString()}`);
          console.log(`   Current user: ${get().user?.email || 'null'}`);
          console.log(`   📍 Triggered from:\n${logoutStack}`);
        }

        // Use centralized logout service (dynamic import to avoid circular dependencies)
        const { performLogout } = await import('./../../auth/services/logoutService');

        await performLogout({
          callBackend: true,
          redirect: options?.redirect !== false, // Default to redirect unless explicitly false
          reason: options?.reason || 'user-initiated',
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'mojeeb-auth-storage',
      // CRITICAL FIX: Use createJSONStorage to ensure proper StorageValue<S> structure
      // This wraps localStorage with correct {state, version} format that Zustand persist expects
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return localStorage.getItem(name);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('[Persist.storage.getItem] Error:', error);
            }
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, value);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('[Persist.storage.setItem] Error:', error);
              if (error instanceof Error && error.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded');
              }
            }
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('[Persist.storage.removeItem] Error:', error);
            }
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
          // CRITICAL FIX: Validate refresh token before trusting it
          // This prevents false positive authentication state from expired/invalid tokens
          if (state?.refreshToken && state?.user) {
            // Validate the token asynchronously - don't block rehydration
            (async () => {
              try {
                const { validateRefreshToken } = await import('@/lib/tokenManager');
                const validation = await validateRefreshToken(state.refreshToken!);

                if (validation.isValid && validation.tokens) {
                  // Update tokens in store with fresh tokens from validation
                  useAuthStore.getState().setTokens(validation.tokens.accessToken, validation.tokens.refreshToken);

                  // Ensure isAuthenticated is true
                  if (!useAuthStore.getState().isAuthenticated) {
                    useAuthStore.setState({ isAuthenticated: true });
                  }

                  // Start proactive token refresh service
                  const { tokenRefreshService } = await import('./../../auth/services/tokenRefreshService');
                  tokenRefreshService.start();
                } else {
                  // Clear all auth state - token is invalid
                  useAuthStore.getState().logout();

                  // Redirect to login page if not already there
                  if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                  }
                }
              } catch (error) {
                if (import.meta.env.DEV) {
                  console.error('Token validation error:', error);
                }

                // Clear all auth state on validation error
                useAuthStore.getState().logout();

                // Redirect to login page if not already there
                if (window.location.pathname !== '/login') {
                  window.location.href = '/login';
                }
              }
            })();

            // Temporarily set authenticated to true to prevent flash of login page
            // Will be corrected by validation above if token is invalid
            state.isAuthenticated = true;
          } else {
            // No refresh token or user - definitely not authenticated
            state.isAuthenticated = false;
          }
        };
      },
    }
  )
);

// DIAGNOSTIC: Subscribe to isAuthenticated changes to track unexpected sign-outs (DEV only)
if (import.meta.env.DEV) {
  useAuthStore.subscribe(
    (state) => state.isAuthenticated,
    (isAuthenticated, previousIsAuthenticated) => {
      if (previousIsAuthenticated && !isAuthenticated) {
        console.error('[AuthStore] Unexpected sign-out detected');
      }
    }
  );
}
