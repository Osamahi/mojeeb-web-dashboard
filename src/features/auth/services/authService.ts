import api from '@/lib/api';
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

class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<any>('/api/auth/login', credentials);

    // Backend returns snake_case, convert to camelCase
    const authResponse: AuthResponse = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    };

    // Update auth store
    useAuthStore.getState().setAuth(authResponse.user, authResponse.accessToken, authResponse.refreshToken);

    return authResponse;
  }

  /**
   * Register new user
   */
  async register(registerData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/register', registerData);

    // Update auth store
    useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);

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
}

export const authService = new AuthService();
