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

// API Response Types (snake_case from backend)
interface ApiAuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface ApiRefreshResponse {
  access_token: string;
  refresh_token: string;
}

class AuthService {
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
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<ApiAuthResponse>('/api/auth/login', credentials);

    // Backend returns snake_case, convert to camelCase
    const authResponse: AuthResponse = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
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
  async loginWithGoogle(accessToken: string): Promise<AuthResponse> {
    const { data } = await api.post<ApiAuthResponse>('/api/auth/oauth', {
      provider: 'google',
      access_token: accessToken,
      id_token: '',
      email: null,
      name: null,
      avatar_url: null,
    });

    // Backend returns snake_case, convert to camelCase
    const authResponse: AuthResponse = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
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
      user: data.user,
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
    console.time('⏱️ AUTH-SERVICE: api.post');
    const { data } = await api.post<ApiAuthResponse>('/api/auth/register', registerData);
    console.timeEnd('⏱️ AUTH-SERVICE: api.post');

    // Backend returns snake_case, convert to camelCase
    const authResponse: AuthResponse = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    };

    // Update auth store
    console.time('⏱️ AUTH-SERVICE: setAuth');
    useAuthStore.getState().setAuth(authResponse.user, authResponse.accessToken, authResponse.refreshToken);
    console.timeEnd('⏱️ AUTH-SERVICE: setAuth');

    // Note: Agent checking is handled in SignUpPage component for new users
    // Existing users logging in will have agents fetched via initializeAgentData() in login()

    return authResponse;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      logger.error('Logout error', error instanceof Error ? error : new Error(String(error)));
    } finally {
      // Clear auth state regardless of API call result
      useAuthStore.getState().logout();
    }
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
    const { data } = await api.get<User>('/api/auth/me');
    useAuthStore.getState().setUser(data);
    return data;
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
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const timestamp = new Date().toISOString();
    console.log(`\n🔄 [AuthService] refreshToken() called at ${timestamp}`);
    console.log(`   📤 Sending refresh token: ${refreshToken.substring(0, 10)}...${refreshToken.substring(refreshToken.length - 10)}`);

    try {
      const { data } = await axios.post<ApiRefreshResponse>(`${API_URL}/api/auth/refresh`, {
        refreshToken: refreshToken,
      });

      console.log(`   📥 Backend response received:`, data);
      console.log(`   🔍 Raw response keys:`, Object.keys(data));
      console.log(`   🔍 access_token (snake_case): ${data.access_token ? 'EXISTS' : 'MISSING'} (${data.access_token?.length || 0} chars)`);
      console.log(`   🔍 refresh_token (snake_case): ${data.refresh_token ? 'EXISTS' : 'MISSING'} (${data.refresh_token?.length || 0} chars)`);

      // Backend returns snake_case, convert to camelCase
      const result = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };

      console.log(`   ✅ Transformation to camelCase complete:`);
      console.log(`      accessToken: ${result.accessToken ? result.accessToken.substring(0, 10) + '...' : 'UNDEFINED'} (${result.accessToken?.length || 0} chars)`);
      console.log(`      refreshToken: ${result.refreshToken ? result.refreshToken.substring(0, 10) + '...' : 'UNDEFINED'} (${result.refreshToken?.length || 0} chars)`);

      return result;
    } catch (error) {
      console.error(`   ❌ [AuthService] refreshToken() FAILED:`, error);
      if (axios.isAxiosError(error)) {
        console.error(`      Status: ${error.response?.status}`);
        console.error(`      Response data:`, error.response?.data);
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
