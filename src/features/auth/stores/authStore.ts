import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth.types';
import { setTokens as setApiTokens, clearTokens as clearApiTokens } from '@/lib/tokenManager';
import { setSentryUser, clearSentryUser } from '@/lib/sentry';
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
        console.log(`\n📦 [AuthStore] setTokens called at ${new Date().toISOString()}`);
        console.log(`   Old Access Token: ${get().accessToken ? get().accessToken?.substring(0, 10) + '...' : 'null'}`);
        console.log(`   New Access Token: ${accessToken ? accessToken.substring(0, 10) + '...' : 'null'} (${accessToken?.length || 0} chars)`);
        console.log(`   New Refresh Token: ${refreshToken ? refreshToken.substring(0, 10) + '...' : 'null'} (${refreshToken?.length || 0} chars)`);

        setApiTokens(accessToken, refreshToken);
        set({ accessToken, refreshToken });

        console.log(`   ✅ AuthStore state updated`);
      },

      setAuth: (user, accessToken, refreshToken) => {
        setApiTokens(accessToken, refreshToken);

        // Set Sentry user context for error tracking
        setSentryUser(user.id, user.email, user.name);

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        console.log(`\n🚪 [AuthStore] logout called at ${new Date().toISOString()}`);
        console.log(`   Current user: ${get().user?.email || 'null'}`);
        console.log(`   Current isAuthenticated: ${get().isAuthenticated}`);

        // Clear tokens from tokenManager
        clearApiTokens();

        // Clear Sentry user context on logout
        clearSentryUser();

        // Clear auth state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });

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

        // Critical fix for flickering loop: Validate accessToken exists before setting isAuthenticated
        if (state?.refreshToken && state?.user) {
          console.log(`   ✅ Found persisted refreshToken and user`);
          console.log(`      User: ${state.user.email}`);
          console.log(`      Refresh Token: ${state.refreshToken.substring(0, 10)}...`);

          const accessToken = localStorage.getItem('accessToken');
          console.log(`   🔍 Checking localStorage for accessToken...`);

          // Only set isAuthenticated if we have BOTH tokens
          if (accessToken && accessToken.trim() !== '') {
            console.log(`   ✅ Access token found: ${accessToken.substring(0, 10)}... (${accessToken.length} chars)`);
            console.log(`   ✅ Setting isAuthenticated = true`);
            state.isAuthenticated = true;
          } else {
            console.log(`   ⚠️ No access token found - has refresh token but needs to refresh`);
            console.log(`   ⚠️ Setting isAuthenticated = false (will trigger refresh flow)`);
            // Has refresh token but no access token - trigger auth flow
            state.isAuthenticated = false;
          }
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
    }
  )
);
