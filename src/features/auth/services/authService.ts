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

// API Response Types (snake_case from backend)
interface ApiAuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface ApiRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Initialize agent data after successful authentication
   * Fetches agents and initializes agent selection
   * @private
   */
  private async initializeAgentData(): Promise<void> {
    try {
      await agentService.getAgents();
      useAgentStore.getState().initializeAgentSelection();
    } catch (error) {
      console.error('Failed to initialize agent selection:', error);
      // Don't fail the authentication if agent initialization fails
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
    const { data } = await api.post<AuthResponse>('/api/auth/register', registerData);

    // Update auth store
    useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);

    // After successful registration, fetch agents and initialize selection
    await this.initializeAgentData();

    return data;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
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
    const { data } = await axios.post<ApiRefreshResponse>(`${API_URL}/api/auth/refresh`, {
      refreshToken: refreshToken,
    });

    // Backend returns camelCase for refresh endpoint
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }
}

export const authService = new AuthService();
