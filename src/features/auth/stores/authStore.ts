import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth.types';
import { setTokens as setApiTokens, clearTokens as clearApiTokens } from '@/lib/tokenManager';
import { setSentryUser, clearSentryUser } from '@/lib/sentry';
import { identifyClarityUser, clearClarityUser } from '@/lib/clarity';
import { sessionHelper } from '@/lib/sessionHelper';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';

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
  logout: () => void;
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
        console.log(`\n📦 [AuthStore] setTokens called at ${new Date().toISOString()}`);
        console.log(`   Old Access Token: ${get().accessToken ? get().accessToken?.substring(0, 10) + '...' : 'null'}`);
        console.log(`   New Access Token: ${accessToken ? accessToken.substring(0, 10) + '...' : 'null'} (${accessToken?.length || 0} chars)`);
        console.log(`   New Refresh Token: ${refreshToken ? refreshToken.substring(0, 10) + '...' : 'null'} (${refreshToken?.length || 0} chars)`);

        // DIAGNOSTIC: Token expiration tracking (decode JWT if possible)
        try {
          if (accessToken) {
            const parts = accessToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              if (payload.exp) {
                const expiresAt = new Date(payload.exp * 1000);
                const now = new Date();
                const minutesUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);

                console.log(`   ⏰ Access Token Expiration:`);
                console.log(`      Expires at: ${expiresAt.toISOString()}`);
                console.log(`      Time until expiry: ${minutesUntilExpiry} minutes`);

                if (minutesUntilExpiry < 0) {
                  console.warn(`      ⚠️ WARNING: Token is already EXPIRED by ${Math.abs(minutesUntilExpiry)} minutes!`);
                } else if (minutesUntilExpiry < 5) {
                  console.warn(`      ⚠️ WARNING: Token expires in less than 5 minutes!`);
                } else if (minutesUntilExpiry < 15) {
                  console.log(`      ✅ Token is valid (expires in ${minutesUntilExpiry} minutes)`);
                }
              }
            }
          }
        } catch (e) {
          // Silently ignore JWT decode errors - not all tokens are JWTs
        }

        // DIAGNOSTIC: Check localStorage BEFORE state update
        const beforePersist = localStorage.getItem('mojeeb-auth-storage');
        console.log(`   📊 BEFORE set(): localStorage['mojeeb-auth-storage'] = ${beforePersist ? 'EXISTS' : 'MISSING'} (${beforePersist?.length || 0} chars)`);

        setApiTokens(accessToken, refreshToken);
        set({ accessToken, refreshToken });

        // DIAGNOSTIC: Check localStorage AFTER state update (allow 100ms for persist middleware)
        setTimeout(() => {
          const afterPersist = localStorage.getItem('mojeeb-auth-storage');
          console.log(`   📊 AFTER set() +100ms: localStorage['mojeeb-auth-storage'] = ${afterPersist ? 'EXISTS' : 'MISSING'} (${afterPersist?.length || 0} chars)`);
          if (afterPersist) {
            try {
              const parsed = JSON.parse(afterPersist);
              console.log(`   📊 Persisted data contains:`);
              console.log(`      - user: ${parsed?.state?.user ? 'YES' : 'NO'}`);
              console.log(`      - refreshToken: ${parsed?.state?.refreshToken ? 'YES (' + parsed.state.refreshToken.substring(0, 10) + '...)' : 'NO'}`);
              console.log(`      - isAuthenticated: ${parsed?.state?.isAuthenticated}`);
            } catch (e) {
              console.error(`   ❌ Failed to parse persisted data:`, e);
            }
          } else {
            console.warn(`   ⚠️ WARNING: Persist middleware did NOT write to localStorage!`);
          }
        }, 100);

        console.log(`   ✅ AuthStore state updated`);
      },

      setAuth: (user, accessToken, refreshToken) => {
        console.log(`\n🔐 [AuthStore] setAuth called at ${new Date().toISOString()}`);
        console.log(`   User: ${user.email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Access Token: ${accessToken.substring(0, 10)}... (${accessToken.length} chars)`);
        console.log(`   Refresh Token: ${refreshToken.substring(0, 10)}... (${refreshToken.length} chars)`);

        // DIAGNOSTIC: Check localStorage BEFORE state update
        const beforePersist = localStorage.getItem('mojeeb-auth-storage');
        console.log(`   📊 BEFORE set(): localStorage['mojeeb-auth-storage'] = ${beforePersist ? 'EXISTS' : 'MISSING'} (${beforePersist?.length || 0} chars)`);

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

        // DIAGNOSTIC: Check localStorage AFTER state update (allow 100ms for persist middleware)
        setTimeout(() => {
          const afterPersist = localStorage.getItem('mojeeb-auth-storage');
          console.log(`   📊 AFTER set() +100ms: localStorage['mojeeb-auth-storage'] = ${afterPersist ? 'EXISTS' : 'MISSING'} (${afterPersist?.length || 0} chars)`);
          if (afterPersist) {
            try {
              const parsed = JSON.parse(afterPersist);
              console.log(`   📊 Persisted data contains:`);
              console.log(`      - user: ${parsed?.state?.user ? `YES (${parsed.state.user.email})` : 'NO'}`);
              console.log(`      - refreshToken: ${parsed?.state?.refreshToken ? 'YES (' + parsed.state.refreshToken.substring(0, 10) + '...)' : 'NO'}`);
              console.log(`      - isAuthenticated: ${parsed?.state?.isAuthenticated}`);
              console.log(`   ✅ Authentication data successfully persisted to localStorage!`);
            } catch (e) {
              console.error(`   ❌ Failed to parse persisted data:`, e);
            }
          } else {
            console.error(`   ❌ CRITICAL: Persist middleware did NOT write to localStorage!`);
            console.error(`   ❌ This will cause user to be logged out on page refresh!`);
          }
        }, 100);

        // Start proactive token refresh service
        import('./../../auth/services/tokenRefreshService').then(({ tokenRefreshService }) => {
          tokenRefreshService.start();
          console.log(`   🔄 Token refresh service started`);
        });

        console.log(`   ✅ Auth state set, isAuthenticated = true`);
      },

      updateUserPhone: (phone) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, phone } });
        }
      },

      logout: () => {
        // DIAGNOSTIC: Capture stack trace to see what triggered logout
        const logoutStack = new Error().stack;

        console.log(`\n🚪 [AuthStore] logout called at ${new Date().toISOString()}`);
        console.log(`   Current user: ${get().user?.email || 'null'}`);
        console.log(`   Current isAuthenticated: ${get().isAuthenticated}`);
        console.log(`   📍 Logout triggered from:\n${logoutStack}`);

        // DIAGNOSTIC: Check localStorage state before clearing
        const persistedState = localStorage.getItem('mojeeb-auth-storage');
        const accessTokenLS = localStorage.getItem('accessToken');
        const refreshTokenLS = localStorage.getItem('refreshToken');
        console.log(`   📊 localStorage state before logout:`);
        console.log(`      mojeeb-auth-storage: ${persistedState ? 'EXISTS' : 'MISSING'} (${persistedState?.length || 0} chars)`);
        console.log(`      accessToken: ${accessTokenLS ? 'EXISTS' : 'MISSING'} (${accessTokenLS?.length || 0} chars)`);
        console.log(`      refreshToken: ${refreshTokenLS ? 'EXISTS' : 'MISSING'} (${refreshTokenLS?.length || 0} chars)`);

        // Clear tokens from tokenManager
        clearApiTokens();

        // Clear Sentry user context on logout
        clearSentryUser();

        // Clear Clarity user identification on logout
        clearClarityUser();

        // Clear phone collection tracking
        sessionHelper.resetSession();

        // Stop proactive token refresh service
        import('./../../auth/services/tokenRefreshService').then(({ tokenRefreshService }) => {
          tokenRefreshService.stop();
          console.log(`   🛑 Token refresh service stopped`);
        });

        // Clear auth state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });

        // CRITICAL FIX: Immediately clear Zustand persist storage to prevent race condition
        // Without this, if page refreshes before persist writes, old data persists causing redirect loops
        console.log(`   🧹 Force clearing Zustand persist storage...`);
        localStorage.removeItem('mojeeb-auth-storage');

        // DIAGNOSTIC: Verify localStorage was cleared
        const persistedAfter = localStorage.getItem('mojeeb-auth-storage');
        const accessTokenAfter = localStorage.getItem('accessToken');
        const refreshTokenAfter = localStorage.getItem('refreshToken');
        console.log(`   📊 localStorage state after logout:`);
        console.log(`      mojeeb-auth-storage: ${persistedAfter ? 'STILL EXISTS ⚠️' : 'CLEARED ✅'}`);
        console.log(`      accessToken: ${accessTokenAfter ? 'STILL EXISTS ⚠️' : 'CLEARED ✅'}`);
        console.log(`      refreshToken: ${refreshTokenAfter ? 'STILL EXISTS ⚠️' : 'CLEARED ✅'}`);

        // Clear other Zustand stores to prevent stale data
        console.log(`   🧹 Clearing AgentStore...`);
        useAgentStore.getState().reset();

        console.log(`   🧹 Clearing ConversationStore...`);
        useConversationStore.getState().clearSelection();

        console.log(`   ✅ User logged out, all stores cleared`);
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'mojeeb-auth-storage',
      // DIAGNOSTIC: Custom storage with error handling and write verification
      storage: {
        getItem: (name) => {
          try {
            const item = localStorage.getItem(name);
            console.log(`   📖 [Persist.storage.getItem] Reading from localStorage['${name}']`);
            console.log(`      Result: ${item ? 'EXISTS (' + item.length + ' chars)' : 'MISSING'}`);
            return item;
          } catch (error) {
            console.error(`   ❌ [Persist.storage.getItem] ERROR reading from localStorage:`, error);
            console.error(`      Error type: ${error instanceof Error ? error.name : 'Unknown'}`);
            console.error(`      Error message: ${error instanceof Error ? error.message : String(error)}`);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            console.log(`   💾 [Persist.storage.setItem] Writing to localStorage['${name}']`);
            console.log(`      Data size: ${value.length} chars`);

            // Attempt write
            localStorage.setItem(name, value);

            // DIAGNOSTIC: Immediate read-back verification
            const verification = localStorage.getItem(name);
            if (verification === value) {
              console.log(`      ✅ Write verified - data persisted successfully`);
            } else if (verification === null) {
              console.error(`      ❌ CRITICAL: Write appeared to succeed but read-back returned NULL!`);
              console.error(`      Possible causes: storage quota exceeded, privacy mode, browser blocking`);
            } else {
              console.error(`      ❌ CRITICAL: Write succeeded but data was CORRUPTED!`);
              console.error(`      Expected length: ${value.length}, Got length: ${verification?.length || 0}`);
            }
          } catch (error) {
            console.error(`   ❌ [Persist.storage.setItem] ERROR writing to localStorage:`, error);
            console.error(`      Error type: ${error instanceof Error ? error.name : 'Unknown'}`);
            console.error(`      Error message: ${error instanceof Error ? error.message : String(error)}`);

            if (error instanceof Error && error.name === 'QuotaExceededError') {
              console.error(`      💾 QUOTA EXCEEDED: localStorage is full!`);
              console.error(`      Current usage: Try clearing old data or increasing quota`);
            } else if (error instanceof Error && error.message.includes('private browsing')) {
              console.error(`      🔒 PRIVATE MODE: localStorage disabled in incognito/private browsing`);
            }

            // Don't throw - persist middleware handles it gracefully
          }
        },
        removeItem: (name) => {
          try {
            console.log(`   🗑️ [Persist.storage.removeItem] Removing localStorage['${name}']`);
            localStorage.removeItem(name);
            console.log(`      ✅ Removal complete`);
          } catch (error) {
            console.error(`   ❌ [Persist.storage.removeItem] ERROR removing from localStorage:`, error);
          }
        },
      },
      partialize: (state) => {
        // DIAGNOSTIC: Log what we're attempting to persist
        const dataToPartialize = {
          user: state.user,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        };
        console.log(`   📝 [Persist.partialize] Selecting data to persist:`);
        console.log(`      - user: ${dataToPartialize.user ? `YES (${dataToPartialize.user.email})` : 'NO'}`);
        console.log(`      - refreshToken: ${dataToPartialize.refreshToken ? `YES (${dataToPartialize.refreshToken.substring(0, 10)}...)` : 'NO'}`);
        console.log(`      - isAuthenticated: ${dataToPartialize.isAuthenticated}`);
        return dataToPartialize;
      },
      onRehydrateStorage: () => {
        console.log(`\n💧 [Persist.onRehydrateStorage] Starting rehydration process...`);

        // DIAGNOSTIC: Check what's in localStorage before rehydration
        const rawStorage = localStorage.getItem('mojeeb-auth-storage');
        console.log(`   📊 Raw localStorage value: ${rawStorage ? 'EXISTS' : 'MISSING'} (${rawStorage?.length || 0} chars)`);
        if (rawStorage) {
          try {
            const parsed = JSON.parse(rawStorage);
            console.log(`   📊 Parsed localStorage structure:`);
            console.log(`      - state: ${parsed?.state ? 'EXISTS' : 'MISSING'}`);
            console.log(`      - state.user: ${parsed?.state?.user ? `EXISTS (${parsed.state.user.email})` : 'MISSING'}`);
            console.log(`      - state.refreshToken: ${parsed?.state?.refreshToken ? `EXISTS (${parsed.state.refreshToken.substring(0, 10)}...)` : 'MISSING'}`);
            console.log(`      - state.isAuthenticated: ${parsed?.state?.isAuthenticated}`);
          } catch (e) {
            console.error(`   ❌ Failed to parse localStorage JSON:`, e);
          }
        }

        return (state) => {
          console.log(`\n💧 [AuthStore] Rehydration callback executing at ${new Date().toISOString()}`);
          console.log(`   📊 Rehydrated state received:`);
          console.log(`      - state object: ${state ? 'EXISTS' : 'NULL'}`);
          console.log(`      - user: ${state?.user ? `EXISTS (${state.user.email})` : 'MISSING'}`);
          console.log(`      - refreshToken: ${state?.refreshToken ? `EXISTS (${state.refreshToken.substring(0, 10)}...)` : 'MISSING'}`);
          console.log(`      - isAuthenticated: ${state?.isAuthenticated}`);

          // CRITICAL FIX: Validate refresh token before trusting it
          // This prevents false positive authentication state from expired/invalid tokens
          if (state?.refreshToken && state?.user) {
          console.log(`   ✅ Found persisted refreshToken and user`);
          console.log(`      User: ${state.user.email}`);
          console.log(`      User ID: ${state.user.id}`);
          console.log(`      Refresh Token: ${state.refreshToken.substring(0, 10)}... (${state.refreshToken.length} chars)`);
          console.log(`   🔍 Validating refresh token with backend...`);

          // Validate the token asynchronously - don't block rehydration
          (async () => {
            try {
              const { validateRefreshToken } = await import('@/lib/tokenManager');
              const validation = await validateRefreshToken(state.refreshToken!);

              if (validation.isValid && validation.tokens) {
                console.log(`   ✅ Token validation SUCCEEDED - user is authenticated`);
                console.log(`      New Access Token: ${validation.tokens.accessToken.substring(0, 10)}... (${validation.tokens.accessToken.length} chars)`);
                console.log(`      New Refresh Token: ${validation.tokens.refreshToken.substring(0, 10)}... (${validation.tokens.refreshToken.length} chars)`);

                // Update tokens in store with fresh tokens from validation
                useAuthStore.getState().setTokens(validation.tokens.accessToken, validation.tokens.refreshToken);

                // Ensure isAuthenticated is true
                if (!useAuthStore.getState().isAuthenticated) {
                  console.log(`   🔧 Setting isAuthenticated = true after successful validation`);
                  useAuthStore.setState({ isAuthenticated: true });
                }

                // Start proactive token refresh service
                const { tokenRefreshService } = await import('./../../auth/services/tokenRefreshService');
                tokenRefreshService.start();
                console.log(`   🔄 Token refresh service started after validation`);
              } else {
                console.log(`   ❌ Token validation FAILED - token is invalid/expired`);
                console.log(`   🧹 Clearing invalid auth state and redirecting to login`);

                // Clear all auth state - token is invalid
                useAuthStore.getState().logout();

                // Redirect to login page if not already there
                if (window.location.pathname !== '/login') {
                  window.location.href = '/login';
                }
              }
            } catch (error) {
              console.error(`   ❌ Token validation ERROR:`, error);
              console.log(`   🧹 Clearing auth state due to validation error`);

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
          console.log(`   ❌ No refresh token or user found in persisted state`);
          console.log(`      Refresh Token: ${state?.refreshToken ? 'exists' : 'missing'}`);
          console.log(`      User: ${state?.user ? 'exists' : 'missing'}`);
          console.log(`   ❌ Setting isAuthenticated = false`);

          // No refresh token or user - definitely not authenticated
          state.isAuthenticated = false;
        }

          console.log(`   🏁 Rehydration complete: isAuthenticated = ${state?.isAuthenticated}`);
        };
      },
    }
  )
);

// DIAGNOSTIC: Subscribe to isAuthenticated changes to track unexpected sign-outs
if (import.meta.env.DEV) {
  useAuthStore.subscribe(
    (state) => state.isAuthenticated,
    (isAuthenticated, previousIsAuthenticated) => {
      if (previousIsAuthenticated && !isAuthenticated) {
        const stack = new Error().stack;
        console.error(`\n🚨 [AuthStore] UNEXPECTED SIGN-OUT DETECTED at ${new Date().toISOString()}`);
        console.error(`   isAuthenticated changed: true → false`);
        console.error(`   Current user: ${useAuthStore.getState().user?.email || 'null'}`);
        console.error(`   Current refreshToken: ${useAuthStore.getState().refreshToken ? 'EXISTS' : 'MISSING'}`);
        console.error(`   📍 Sign-out triggered from:\n${stack}`);
        console.error(`   ⚠️ This might indicate a bug - check the stack trace above!`);
      }
    }
  );
  console.log('🔍 [AuthStore] Monitoring isAuthenticated for unexpected sign-outs...');
}

// DIAGNOSTIC: Global helper to verify auth persistence (available in browser console)
if (typeof window !== 'undefined') {
  (window as any).verifyAuthPersistence = () => {
    console.log('\n🔍 [DIAGNOSTIC] Auth Persistence Verification Report');
    console.log('================================================\n');

    const currentState = useAuthStore.getState();
    const rawStorage = localStorage.getItem('mojeeb-auth-storage');
    const accessTokenLS = localStorage.getItem('accessToken');
    const refreshTokenLS = localStorage.getItem('refreshToken');

    console.log('1️⃣ ZUSTAND STORE STATE:');
    console.log(`   - user: ${currentState.user ? `EXISTS (${currentState.user.email})` : 'MISSING'}`);
    console.log(`   - accessToken: ${currentState.accessToken ? `EXISTS (${currentState.accessToken.substring(0, 10)}...)` : 'MISSING'}`);
    console.log(`   - refreshToken: ${currentState.refreshToken ? `EXISTS (${currentState.refreshToken.substring(0, 10)}...)` : 'MISSING'}`);
    console.log(`   - isAuthenticated: ${currentState.isAuthenticated}`);
    console.log(`   - isLoading: ${currentState.isLoading}\n`);

    console.log('2️⃣ LOCALSTORAGE - ZUSTAND PERSIST:');
    console.log(`   - mojeeb-auth-storage: ${rawStorage ? `EXISTS (${rawStorage.length} chars)` : 'MISSING'}`);
    if (rawStorage) {
      try {
        const parsed = JSON.parse(rawStorage);
        console.log(`   - Persisted user: ${parsed?.state?.user ? `YES (${parsed.state.user.email})` : 'NO'}`);
        console.log(`   - Persisted refreshToken: ${parsed?.state?.refreshToken ? `YES (${parsed.state.refreshToken.substring(0, 10)}...)` : 'NO'}`);
        console.log(`   - Persisted isAuthenticated: ${parsed?.state?.isAuthenticated}`);
      } catch (e) {
        console.error(`   ❌ ERROR: Failed to parse - ${e}`);
      }
    }
    console.log('');

    console.log('3️⃣ LOCALSTORAGE - TOKEN MANAGER:');
    console.log(`   - accessToken: ${accessTokenLS ? `EXISTS (${accessTokenLS.substring(0, 10)}...)` : 'MISSING'}`);
    console.log(`   - refreshToken: ${refreshTokenLS ? `EXISTS (${refreshTokenLS.substring(0, 10)}...)` : 'MISSING'}\n`);

    console.log('4️⃣ CONSISTENCY CHECK:');
    const storeHasAuth = currentState.isAuthenticated && currentState.user && currentState.refreshToken;
    const persistHasAuth = rawStorage && JSON.parse(rawStorage)?.state?.user && JSON.parse(rawStorage)?.state?.refreshToken;
    const tokenManagerHasTokens = accessTokenLS && refreshTokenLS;

    console.log(`   - Store has auth: ${storeHasAuth ? '✅ YES' : '❌ NO'}`);
    console.log(`   - Persist has auth: ${persistHasAuth ? '✅ YES' : '❌ NO'}`);
    console.log(`   - TokenManager has tokens: ${tokenManagerHasTokens ? '✅ YES' : '❌ NO'}`);

    if (storeHasAuth && persistHasAuth && tokenManagerHasTokens) {
      console.log('\n✅ VERDICT: All systems consistent - auth should persist correctly');
    } else if (!storeHasAuth && !persistHasAuth && !tokenManagerHasTokens) {
      console.log('\n✅ VERDICT: User is not logged in - this is correct');
    } else {
      console.warn('\n⚠️ VERDICT: INCONSISTENT STATE DETECTED!');
      console.warn('   This indicates a bug in the auth system.');
      console.warn('   Expected all three to match (all YES or all NO)');
    }

    console.log('\n================================================');
  };

  console.log('💡 [AuthStore] Type verifyAuthPersistence() in console to check auth state');

  // DIAGNOSTIC: Listen for localStorage changes from other tabs/sources
  window.addEventListener('storage', (event) => {
    if (event.key === 'mojeeb-auth-storage') {
      console.warn(`\n🔄 [Storage Event] localStorage['mojeeb-auth-storage'] changed externally at ${new Date().toISOString()}`);
      console.warn(`   Triggered by: ${event.url || 'unknown source'}`);
      console.warn(`   Old value: ${event.oldValue ? 'EXISTS (' + event.oldValue.length + ' chars)' : 'MISSING'}`);
      console.warn(`   New value: ${event.newValue ? 'EXISTS (' + event.newValue.length + ' chars)' : 'MISSING'}`);

      if (!event.newValue && event.oldValue) {
        console.error(`   ❌ CRITICAL: Auth storage was DELETED externally!`);
        console.error(`   This will cause logout on next page refresh.`);
        console.error(`   Possible causes: other tab, browser extension, privacy settings`);
      } else if (event.newValue && !event.oldValue) {
        console.log(`   ✅ Auth storage was CREATED externally (login from another tab)`);
      } else if (event.newValue && event.oldValue) {
        console.log(`   🔄 Auth storage was UPDATED externally (token refresh from another tab)`);
      }
    }
  });

  // DIAGNOSTIC: Track window lifecycle events that might affect auth
  window.addEventListener('beforeunload', () => {
    const finalState = localStorage.getItem('mojeeb-auth-storage');
    console.log(`\n👋 [Window Lifecycle] beforeunload event at ${new Date().toISOString()}`);
    console.log(`   Final localStorage state: ${finalState ? 'EXISTS (' + finalState.length + ' chars)' : 'MISSING'}`);
    if (finalState) {
      console.log(`   ✅ Auth data preserved for next session`);
    } else {
      console.warn(`   ⚠️ WARNING: No auth data in localStorage - user will be logged out`);
    }
  });

  window.addEventListener('pagehide', () => {
    const currentState = useAuthStore.getState();
    console.log(`\n📤 [Window Lifecycle] pagehide event at ${new Date().toISOString()}`);
    console.log(`   Store isAuthenticated: ${currentState.isAuthenticated}`);
    console.log(`   Store has user: ${currentState.user ? 'YES' : 'NO'}`);
  });

  window.addEventListener('pageshow', (event) => {
    console.log(`\n📥 [Window Lifecycle] pageshow event at ${new Date().toISOString()}`);
    console.log(`   From cache (bfcache): ${event.persisted}`);
    console.log(`   Current isAuthenticated: ${useAuthStore.getState().isAuthenticated}`);
  });

  console.log('🔍 [AuthStore] Storage and lifecycle event listeners registered');
}
