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
          // CRITICAL FIX: Skip auth rehydration on OAuth callback page
          // When the OAuth popup loads dashboard.mojeeb.app/oauth/callback, it initializes
          // the full React app including Zustand. The rehydration validation would either:
          // 1. Call refreshToken(), invalidating the parent window's token
          // 2. Fail validation and call logout(), clearing localStorage tokens
          // Both scenarios break the parent window's auth state.
          const isOAuthCallback = window.location.pathname === '/oauth/callback';
          if (isOAuthCallback) {
            // Don't validate or modify auth state in OAuth popup
            if (state) {
              state.isAuthenticated = false; // Popup doesn't need auth
            }
            return;
          }

          // CRITICAL FIX: Validate refresh token before trusting it
          // This prevents false positive authentication state from expired/invalid tokens
          if (state?.refreshToken && state?.user) {
            // Validate the token asynchronously - don't block rehydration
            (async () => {
              const MAX_RETRIES = 2;
              const RETRY_DELAY_MS = 2000;

              // SCENARIO C diagnostics: capture every attempt so we can tell
              // whether the token was genuinely invalid (returned isValid=false
              // immediately) vs. network blips (threw, retried, then gave up).
              const rehydrationStart = Date.now();
              const attemptOutcomes: Array<{
                attempt: number;
                durationMs: number;
                outcome: 'success' | 'invalid' | 'threw';
                errorName?: string;
                errorMessage?: string;
              }> = [];
              let breakReason: 'success' | 'validation-returned-invalid' | 'all-retries-exhausted' | 'unknown' = 'unknown';

              // NOTE: Refresh tokens in this app are OPAQUE base64url random
              // strings issued by the backend (see AuthController.cs::GenerateRefreshToken),
              // not JWTs. There's no client-visible expiry to decode — server
              // tracks it in the `refresh_tokens` DB table. We just report
              // structural info so a failed validation log can distinguish
              // "missing" from "corrupted shape" from "normal-looking opaque".
              const persistedRefreshShape = {
                length: state.refreshToken?.length ?? 0,
                looksOpaque: !!state.refreshToken && !state.refreshToken.includes('.'),
                firstChars: state.refreshToken ? state.refreshToken.slice(0, 4) : null,
              };

              for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                const attemptStart = Date.now();
                try {
                  const { validateRefreshToken } = await import('@/lib/tokenManager');
                  const validation = await validateRefreshToken(state.refreshToken!);

                  if (validation.isValid && validation.tokens) {
                    attemptOutcomes.push({
                      attempt: attempt + 1,
                      durationMs: Date.now() - attemptStart,
                      outcome: 'success',
                    });
                    breakReason = 'success';

                    // Update tokens in store with fresh tokens from validation
                    useAuthStore.getState().setTokens(validation.tokens.accessToken, validation.tokens.refreshToken);

                    // Ensure isAuthenticated is true
                    if (!useAuthStore.getState().isAuthenticated) {
                      useAuthStore.setState({ isAuthenticated: true });
                    }

                    // Start proactive token refresh service
                    const { tokenRefreshService } = await import('./../../auth/services/tokenRefreshService');
                    tokenRefreshService.start();
                    return; // Success — exit the retry loop
                  } else {
                    // Token is genuinely invalid (not a network error) — no point retrying
                    attemptOutcomes.push({
                      attempt: attempt + 1,
                      durationMs: Date.now() - attemptStart,
                      outcome: 'invalid',
                    });
                    breakReason = 'validation-returned-invalid';
                    break;
                  }
                } catch (error) {
                  attemptOutcomes.push({
                    attempt: attempt + 1,
                    durationMs: Date.now() - attemptStart,
                    outcome: 'threw',
                    errorName: error instanceof Error ? error.name : typeof error,
                    errorMessage: error instanceof Error ? error.message : String(error),
                  });

                  if (import.meta.env.DEV) {
                    console.error(`Token validation error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error);
                  }

                  // If we have retries left, wait and try again (could be a network blip)
                  if (attempt < MAX_RETRIES) {
                    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
                    continue;
                  }
                  // Fall through to logout after all retries exhausted
                  breakReason = 'all-retries-exhausted';
                }
              }

              // --- SCENARIO C: we get here only when the loop gave up ---
              // Log everything that might help diagnose. NOTE: we intentionally
              // use logger.error (always prints in production too) because this
              // path ends a user's session silently — we NEED visibility.
              const { logger: authLogger } = await import('@/lib/logger');
              authLogger.error(
                '[AuthStore.rehydrate]',
                '[SCENARIO_C] Refresh-token validation failed during rehydration — clearing session (NO forced redirect)',
                {
                  scenario: 'C_rehydration_validation_failed',
                  breakReason,
                  ts: new Date().toISOString(),
                  totalDurationMs: Date.now() - rehydrationStart,
                  attempts: attemptOutcomes,
                  maxRetries: MAX_RETRIES,
                  retryDelayMs: RETRY_DELAY_MS,
                  persistedUser: {
                    userId: state.user?.id ?? null,
                    userEmail: state.user?.email ?? null,
                    hadAccessToken: !!state.accessToken,
                    hadRefreshToken: !!state.refreshToken,
                  },
                  persistedRefreshToken: persistedRefreshShape,
                  page: {
                    pathname: window.location.pathname,
                    search: window.location.search,
                    visibilityState: document.visibilityState,
                    hasFocus: document.hasFocus(),
                  },
                  browser: {
                    online: navigator.onLine,
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                  },
                }
              );

              // All retries failed or token is genuinely invalid — clear the session
              // in-memory but do NOT force a location change. The router's
              // ProtectedRoute guard will redirect to /login on the next render
              // now that isAuthenticated is false and refreshToken is cleared.
              // This avoids blowing away the user's current page for a transient
              // validation failure (network blip, backend restart, etc.).
              const { performLogout } = await import('./../../auth/services/logoutService');
              await performLogout({
                callBackend: false, // token is already invalid, don't bother
                redirect: false,
                reason: 'token-invalid',
              });
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
