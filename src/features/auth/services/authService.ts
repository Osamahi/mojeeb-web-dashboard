import api from '@/lib/api';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  User,
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
   * Initialize agent data after successful authentication
   * Fetches agents and initializes agent selection
   * @private
   */
  private async initializeAgentData(): Promise<void> {
    try {
      const agents = await agentService.getAgents();

      if (!agents || agents.length === 0) {
        logger.warn('User has no agents - needs onboarding or agent creation');
        // User authenticated successfully but has no agents
        // This is a valid state - they may need to create their first agent
        return;
      }

      useAgentStore.getState().setAgents(agents);
      useAgentStore.getState().initializeAgentSelection();

      logger.info('Agent selection initialized successfully', {
        selectedAgentId: agents[0]?.id,
        totalAgents: agents.length,
      });
    } catch (error) {
      logger.error('Failed to initialize agent selection', error instanceof Error ? error : new Error(String(error)));
      // Don't fail the authentication if agent initialization fails
      // The user can still access the app and retry manually or create an agent
    }
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

    // After successful login, fetch agents and initialize selection
    await this.initializeAgentData();

    return authResponse;
  }

  /**
   * Login with Google OAuth
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

    // After successful login, fetch agents and initialize selection
    await this.initializeAgentData();

    return authResponse;
  }

  /**
   * Login with Apple Sign-In
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

    // After successful login, fetch agents and initialize selection
    await this.initializeAgentData();

    return authResponse;
  }

  /**
   * Register new user
   */
  async register(registerData: RegisterData): Promise<AuthResponse> {
    if (import.meta.env.DEV) {
      console.time('⏱️ AUTH-SERVICE: api.post');
    }
    const { data } = await api.post<ApiAuthResponse>('/api/auth/register', registerData);
    if (import.meta.env.DEV) {
      console.timeEnd('⏱️ AUTH-SERVICE: api.post');
    }

    // Backend returns snake_case, convert to camelCase
    const authResponse: AuthResponse = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: this.transformUser(data.user),
    };

    // Update auth store
    if (import.meta.env.DEV) {
      console.time('⏱️ AUTH-SERVICE: setAuth');
    }
    useAuthStore.getState().setAuth(authResponse.user, authResponse.accessToken, authResponse.refreshToken);
    if (import.meta.env.DEV) {
      console.timeEnd('⏱️ AUTH-SERVICE: setAuth');
    }

    // Note: Agent checking is handled in SignUpPage component for new users
    // Existing users logging in will have agents fetched via initializeAgentData() in login()

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
      if (import.meta.env.DEV) {
        console.log('[AuthService] Token refresh already in progress, reusing promise');
      }
      return this.refreshPromise;
    }

    if (import.meta.env.DEV) {
      const timestamp = new Date().toISOString();
      console.log(`\n🔄 [AuthService] refreshToken() called at ${timestamp}`);
      console.log(`   📤 Sending refresh token (length: ${refreshToken.length} chars)`);
    }

    // Create the refresh promise
    const promise = (async () => {
      try {
        const { data } = await axios.post<ApiRefreshResponse>(`${API_URL}/api/auth/refresh`, {
          refreshToken: refreshToken,
        });

        if (import.meta.env.DEV) {
          console.log(`   📥 Backend response received:`, data);
          console.log(`   🔍 Raw response keys:`, Object.keys(data));
          console.log(`   🔍 access_token (snake_case): ${data.access_token ? 'EXISTS' : 'MISSING'} (${data.access_token?.length || 0} chars)`);
          console.log(`   🔍 refresh_token (snake_case): ${data.refresh_token ? 'EXISTS' : 'MISSING'} (${data.refresh_token?.length || 0} chars)`);
        }

        // Backend returns snake_case, convert to camelCase
        const result = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        };

        if (import.meta.env.DEV) {
          console.log(`   ✅ Transformation to camelCase complete:`);
          console.log(`      accessToken: ${result.accessToken ? 'EXISTS' : 'UNDEFINED'} (${result.accessToken?.length || 0} chars)`);
          console.log(`      refreshToken: ${result.refreshToken ? 'EXISTS' : 'UNDEFINED'} (${result.refreshToken?.length || 0} chars)`);
        }

        return result;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`   ❌ [AuthService] refreshToken() FAILED:`, error);
          if (axios.isAxiosError(error)) {
            console.error(`      Status: ${error.response?.status}`);
            console.error(`      Response data:`, error.response?.data);
          }
        }
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
