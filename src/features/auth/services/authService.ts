import api from '@/lib/api';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { env } from '@/config/env';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  User,
  PostAuthNavigationResult,
} from '../types/auth.types';
import { useAuthStore } from '../stores/authStore';
import { agentService } from '@/features/agents/services/agentService';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { logger } from '@/lib/logger';
import { setTokens } from '@/lib/tokenManager';
import { updateSupabaseAuth } from '@/lib/supabase';

// API Response Types (snake_case from backend)
interface ApiUserResponse {
  id: string;
  email: string;
  name: string;
  role: number;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  o_auth_provider?: string;
  o_auth_provider_user_id?: string;
}

interface ApiAuthResponse {
  access_token: string;
  refresh_token: string;
  user: ApiUserResponse;
}

interface ApiRefreshResponse {
  access_token: string;
  refresh_token: string;
}

class AuthService {
  // Prevent concurrent token refreshes - store the in-flight refresh promise
  private refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

  /**
   * Complete post-authentication flow
   * Unified business logic for all auth methods (login, signup, Google, Apple)
   *
   * Responsibilities:
   * 1. Fetch user's agents and initialize agent selection
   * 2. Check for pending invitations
   * 3. Determine navigation destination based on state
   *
   * Navigation Logic:
   * - Has pending invitations → /conversations (modal auto-shows)
   * - Has agents but no invitations → /conversations
   * - No agents and no invitations → /onboarding (agent creation)
   *
   * Error Handling:
   * - Agent fetch failures: Non-fatal, continues with hasAgents=false
   * - Invitation check failures: Non-fatal, continues without invitations
   * - Component unmount (AbortError): Immediately returns fallback destination
   *
   * @param userEmail - Email of authenticated user
   * @param signal - Optional AbortSignal to cancel flow on component unmount
   * @returns Navigation destination and reason
   */
  async completeAuthFlow(
    userEmail: string,
    signal?: AbortSignal
  ): Promise<PostAuthNavigationResult> {
    logger.info('Starting post-auth flow', {
      component: 'AuthService',
      method: 'completeAuthFlow',
      userEmail,
    });

    // Check if already aborted
    if (signal?.aborted) {
      logger.info('Auth flow aborted before start', {
        component: 'AuthService',
        method: 'completeAuthFlow',
      });
      return { destination: '/conversations', reason: 'has_agents' };
    }

    // 1. Fetch and initialize agents
    logger.info('Fetching user agents', {
      component: 'AuthService',
      method: 'completeAuthFlow',
      step: 'fetch_agents',
    });
    let hasAgents = false;

    try {
      const agents = await agentService.getAgents();

      // Check abort after async operation
      if (signal?.aborted) {
        logger.info('Auth flow aborted after agent fetch', {
          component: 'AuthService',
          method: 'completeAuthFlow',
        });
        return { destination: '/conversations', reason: 'has_agents' };
      }

      hasAgents = agents && agents.length > 0;

      if (hasAgents) {
        useAgentStore.getState().setAgents(agents);
        useAgentStore.getState().initializeAgentSelection();
        logger.info('Agent selection initialized', {
          component: 'AuthService',
          method: 'completeAuthFlow',
          selectedAgentId: agents[0]?.id,
          totalAgents: agents.length,
        });
      } else {
        logger.info('User has no agents', {
          component: 'AuthService',
          method: 'completeAuthFlow',
        });
      }
    } catch (error) {
      logger.error('Error fetching agents (non-fatal, continuing)', error instanceof Error ? error : new Error(String(error)), {
        component: 'AuthService',
        method: 'completeAuthFlow',
      });
      // Continue with hasAgents = false
    }

    // 2. Check for pending invitations
    logger.info('Checking for pending invitations', {
      component: 'AuthService',
      method: 'completeAuthFlow',
      step: 'check_invitations',
    });
    const { invitationService } = await import('@/features/organizations/services/invitationService');
    const { useInvitationStore } = await import('@/features/organizations/stores/invitationStore');

    // Check abort after dynamic imports
    if (signal?.aborted) {
      logger.info('Auth flow aborted after invitation import', {
        component: 'AuthService',
        method: 'completeAuthFlow',
      });
      return { destination: '/conversations', reason: 'has_agents' };
    }

    let hasInvitations = false;

    try {
      const invitations = await invitationService.getMyPendingInvitations();

      // Check abort after async operation
      if (signal?.aborted) {
        logger.info('Auth flow aborted after invitation fetch', {
          component: 'AuthService',
          method: 'completeAuthFlow',
        });
        return { destination: '/conversations', reason: 'has_agents' };
      }

      if (invitations && invitations.length > 0) {
        hasInvitations = true;
        useInvitationStore.getState().setPendingInvitations(invitations);
        useInvitationStore.getState().setShowModal(true);

        logger.info('Found pending invitations', {
          component: 'AuthService',
          method: 'completeAuthFlow',
          count: invitations.length,
          organizations: invitations.map((inv) => inv.organizationName),
        });
      } else {
        logger.info('No pending invitations found', {
          component: 'AuthService',
          method: 'completeAuthFlow',
        });
      }
    } catch (error) {
      logger.error('Error checking invitations (non-fatal, continuing)', error instanceof Error ? error : new Error(String(error)), {
        component: 'AuthService',
        method: 'completeAuthFlow',
      });
      // Don't fail the auth flow if invitation check fails
    }

    // 3. Determine navigation based on state
    if (hasInvitations) {
      logger.info('Navigating to conversations (has invitations)', {
        component: 'AuthService',
        method: 'completeAuthFlow',
        destination: '/conversations',
        reason: 'has_invitations',
      });
      return { destination: '/conversations', reason: 'has_invitations' };
    }

    if (hasAgents) {
      logger.info('Navigating to conversations (has agents)', {
        component: 'AuthService',
        method: 'completeAuthFlow',
        destination: '/conversations',
        reason: 'has_agents',
      });
      return { destination: '/conversations', reason: 'has_agents' };
    }

    logger.info('Navigating to onboarding (no agents)', {
      component: 'AuthService',
      method: 'completeAuthFlow',
      destination: '/onboarding',
      reason: 'no_agents',
    });
    return { destination: '/onboarding', reason: 'no_agents' };
  }

  /**
   * Transform API user response (snake_case) to User type (camelCase)
   * @private
   */
  private transformUser(apiUser: ApiUserResponse): User {
    return {
      id: apiUser.id,
      email: apiUser.email,
      name: apiUser.name,
      role: apiUser.role,
      phone: apiUser.phone,
      avatarUrl: apiUser.avatar_url,
      createdAt: apiUser.created_at,
      updatedAt: apiUser.updated_at,
      oauthProvider: apiUser.o_auth_provider,
      oauthProviderUserId: apiUser.o_auth_provider_user_id,
    };
  }

  /**
   * Login with email and password
   * Note: Post-auth flow (agents, invitations, navigation) handled by usePostAuthNavigation hook
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<ApiAuthResponse>('/api/auth/login', credentials);

    // Backend returns snake_case, convert to camelCase
    const authResponse: AuthResponse = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: this.transformUser(data.user),
    };

    // Update auth store
    useAuthStore.getState().setAuth(authResponse.user, authResponse.accessToken, authResponse.refreshToken);

    return authResponse;
  }

  /**
   * Login with Google OAuth
   * Note: Post-auth flow (agents, invitations, navigation) handled by usePostAuthNavigation hook
   */
  async loginWithGoogle(
    accessToken: string,
    email: string,
    name: string,
    avatarUrl: string
  ): Promise<AuthResponse> {
    const { data } = await api.post<ApiAuthResponse>('/api/auth/oauth', {
      provider: 'google',
      access_token: accessToken,
      id_token: '',
      email: email,
      name: name,
      avatar_url: avatarUrl,
    });

    // Backend returns snake_case, convert to camelCase
    const authResponse: AuthResponse = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: this.transformUser(data.user),
    };

    // Update auth store
    useAuthStore.getState().setAuth(authResponse.user, authResponse.accessToken, authResponse.refreshToken);

    return authResponse;
  }

  /**
   * Login with Google using authorization code (redirect flow)
   * Backend will exchange code for tokens and fetch user info
   * Note: Post-auth flow (agents, invitations, navigation) handled by usePostAuthNavigation hook
   */
  async loginWithGoogleCode(authorizationCode: string): Promise<AuthResponse> {
    const { data } = await api.post<ApiAuthResponse>('/api/auth/google/code', {
      code: authorizationCode,
      redirect_uri: env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`,
    });

    // Backend returns snake_case, convert to camelCase
    const authResponse: AuthResponse = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: this.transformUser(data.user),
    };

    // Update auth store
    useAuthStore.getState().setAuth(authResponse.user, authResponse.accessToken, authResponse.refreshToken);

    return authResponse;
  }

  /**
   * Login with Apple Sign-In
   * Note: Post-auth flow (agents, invitations, navigation) handled by usePostAuthNavigation hook
   */
  async loginWithApple(idToken: string): Promise<AuthResponse> {
    const { data } = await api.post<ApiAuthResponse>('/api/auth/oauth', {
      provider: 'apple',
      access_token: idToken,
      id_token: idToken,
      email: null,
      name: null,
      avatar_url: null,
    });

    // Backend returns snake_case, convert to camelCase
    const authResponse: AuthResponse = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: this.transformUser(data.user),
    };

    // Update auth store
    useAuthStore.getState().setAuth(authResponse.user, authResponse.accessToken, authResponse.refreshToken);

    return authResponse;
  }

  /**
   * Register new user
   * Note: Post-auth flow (agents, invitations, navigation) handled by usePostAuthNavigation hook
   */
  async register(registerData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post<ApiAuthResponse>('/api/auth/register', registerData);

    // Backend returns snake_case, convert to camelCase
    const authResponse: AuthResponse = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: this.transformUser(data.user),
    };

    // Update auth store
    useAuthStore.getState().setAuth(authResponse.user, authResponse.accessToken, authResponse.refreshToken);

    return authResponse;
  }

  /**
   * Request password reset email
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await api.post('/api/auth/forgot-password', request);
  }

  /**
   * Reset password with token
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await api.post('/api/auth/reset-password', request);
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await api.post('/api/auth/change-password', request);
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<ApiUserResponse>('/api/auth/me');
    const user = this.transformUser(data);
    useAuthStore.getState().setUser(user);
    return user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  }

  /**
   * Get current user from store
   */
  getUser(): User | null {
    return useAuthStore.getState().user;
  }

  /**
   * Refresh access token using refresh token
   * Centralized token refresh logic to avoid duplication
   *
   * Note: Uses raw axios instead of api instance to avoid triggering interceptors
   * and causing recursion when called from the response interceptor
   *
   * Includes race condition protection - if multiple calls happen simultaneously,
   * they will share the same refresh promise
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // If a refresh is already in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Create the refresh promise
    const promise = (async () => {
      try {
        const { data } = await axios.post<ApiRefreshResponse>(`${API_URL}/api/auth/refresh`, {
          refreshToken: refreshToken,
        });

        // Backend returns snake_case, convert to camelCase
        const result = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        };

        return result;
      } catch (error) {
        throw error;
      }
    })();

    // Store the promise for concurrent callers to share
    this.refreshPromise = promise;

    try {
      return await promise;
    } finally {
      // Only clear if this is still the active promise (prevents race condition)
      if (this.refreshPromise === promise) {
        this.refreshPromise = null;
      }
    }
  }

  /**
   * Refresh token and update all auth-related systems
   * Consolidates: token refresh + storage + Supabase auth update
   *
   * This method should be used whenever tokens need to be refreshed to ensure
   * consistent behavior across the app (AuthInitializer, API interceptor, etc.)
   *
   * @param refreshToken - The current refresh token
   * @returns The new tokens
   * @throws Error if refresh fails
   */
  async refreshAndUpdateSession(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    logger.info('Refreshing session and updating auth systems', { component: 'AuthService' });

    try {
      // 1. Refresh tokens from backend
      const tokens = await this.refreshToken(refreshToken);

      // 2. Store tokens in secure storage (dual storage: SecureLS + localStorage)
      setTokens(tokens.accessToken, tokens.refreshToken);

      // 3. Update Supabase auth session for real-time channels
      await updateSupabaseAuth(tokens.accessToken, tokens.refreshToken);

      logger.info('Session refresh complete', {
        component: 'AuthService',
        accessTokenLength: tokens.accessToken.length,
        refreshTokenLength: tokens.refreshToken.length,
      });

      return tokens;
    } catch (error) {
      logger.error('Session refresh failed', error instanceof Error ? error : new Error(String(error)), {
        component: 'AuthService',
      });
      throw error;
    }
  }
}

export const authService = new AuthService();
