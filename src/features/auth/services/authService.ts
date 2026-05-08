import api from '@/lib/api';
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
import { detectCountryFromTimezone } from '@/features/onboarding/utils/countryDetector';

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

class AuthService {
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

    // 1. Decide whether the user has any agents (drives the "go to /conversations
    //    vs /onboarding" branch below). We only need to know if at least one
    //    exists, so fetch a single row instead of a full list.
    logger.info('Probing whether user has any agents', {
      component: 'AuthService',
      method: 'completeAuthFlow',
      step: 'probe_agents',
    });
    let hasAgents = false;

    try {
      const firstPage = await agentService.getAgentsCursor({ limit: 1 });

      if (signal?.aborted) {
        logger.info('Auth flow aborted after agent probe', {
          component: 'AuthService',
          method: 'completeAuthFlow',
        });
        return { destination: '/conversations', reason: 'has_agents' };
      }

      const firstAgent = firstPage.items[0];
      hasAgents = !!firstAgent;

      if (hasAgents && firstAgent) {
        // Seed the global selection so the dashboard renders an agent on
        // first paint. The full agent list is loaded on demand by the
        // GlobalAgentSelector / AgentsPage via useInfiniteAgents.
        useAgentStore.getState().setGlobalSelectedAgent(firstAgent);
        logger.info('Initial agent selection seeded from first cursor page', {
          component: 'AuthService',
          method: 'completeAuthFlow',
          selectedAgentId: firstAgent.id,
        });
      } else {
        logger.info('User has no agents', {
          component: 'AuthService',
          method: 'completeAuthFlow',
        });
      }
    } catch (error) {
      logger.error('Error probing agents (non-fatal, continuing)', error instanceof Error ? error : new Error(String(error)), {
        component: 'AuthService',
        method: 'completeAuthFlow',
      });
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
    const funnelSessionId = (() => {
      try { return localStorage.getItem('mojeeb_funnel_session') ?? undefined; } catch { return undefined; }
    })();

    const { data } = await api.post<ApiAuthResponse>('/api/auth/oauth', {
      provider: 'google',
      access_token: accessToken,
      id_token: '',
      email: email,
      name: name,
      avatar_url: avatarUrl,
      country: detectCountryFromTimezone(),
    }, {
      headers: funnelSessionId ? { 'X-Funnel-Session': funnelSessionId } : undefined,
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
    const funnelSessionId = (() => {
      try { return localStorage.getItem('mojeeb_funnel_session') ?? undefined; } catch { return undefined; }
    })();

    const { data } = await api.post<ApiAuthResponse>('/api/auth/google/code', {
      code: authorizationCode,
      redirect_uri: env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`,
      country: detectCountryFromTimezone(),
    }, {
      headers: funnelSessionId ? { 'X-Funnel-Session': funnelSessionId } : undefined,
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
      country: detectCountryFromTimezone(),
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
    // Include funnel session ID for anonymous event linking
    const funnelSessionId = (() => {
      try { return localStorage.getItem('mojeeb_funnel_session') ?? undefined; } catch { return undefined; }
    })();

    const { data } = await api.post<ApiAuthResponse>('/api/auth/register', registerData, {
      headers: funnelSessionId ? { 'X-Funnel-Session': funnelSessionId } : undefined,
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
   * Request password reset email
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await api.post('/api/auth/forgot-password', request);
  }

  /**
   * Reset password with token
   * Backend expects snake_case fields per global Newtonsoft config + JsonPropertyName attributes.
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await api.post('/api/auth/reset-password', {
      token: request.token,
      new_password: request.newPassword,
    });
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

  // Token refresh is owned by lib/authSession.ts. See it for the full
  // refresh flow, dedup, and error model. AuthService no longer participates
  // in refresh — login/signup paths still write tokens via setAuth, but
  // refresh-on-401 and refresh-on-mount route through authSession.
}

export const authService = new AuthService();
