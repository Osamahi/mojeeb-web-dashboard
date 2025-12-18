import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
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

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
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

        setApiTokens(accessToken, refreshToken);
        set({ accessToken, refreshToken });

        console.log(`   ✅ AuthStore state updated`);
      },

      setAuth: (user, accessToken, refreshToken) => {
        console.log(`\n🔐 [AuthStore] setAuth called at ${new Date().toISOString()}`);
        console.log(`   User: ${user.email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Access Token: ${accessToken.substring(0, 10)}... (${accessToken.length} chars)`);
        console.log(`   Refresh Token: ${refreshToken.substring(0, 10)}... (${refreshToken.length} chars)`);

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
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        console.log(`\n💧 [AuthStore] Rehydrating from localStorage at ${new Date().toISOString()}`);

        // CRITICAL FIX: Only check for refreshToken (persisted by Zustand - guaranteed to exist)
        // Don't check accessToken from localStorage - it's in separate storage (tokenManager)
        // and causes race condition. AuthInitializer will validate/refresh it later.
        if (state?.refreshToken && state?.user) {
          console.log(`   ✅ Found persisted refreshToken and user`);
          console.log(`      User: ${state.user.email}`);
          console.log(`      User ID: ${state.user.id}`);
          console.log(`      Refresh Token: ${state.refreshToken.substring(0, 10)}... (${state.refreshToken.length} chars)`);
          console.log(`   ✅ Setting isAuthenticated = true (AuthInitializer will validate tokens)`);

          // Trust the persisted refreshToken - AuthInitializer will handle validation/refresh
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
      },
    })
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
