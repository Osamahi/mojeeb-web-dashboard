import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Role, type User } from '../types/auth.types';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

// Hoist mocks to avoid initialization errors
const mocks = vi.hoisted(() => ({
  mockSetAuth: vi.fn(),
  mockSetUser: vi.fn(),
  mockLogout: vi.fn(),
  mockIsAuthenticated: vi.fn(() => false),
  mockUser: vi.fn(() => null),
  mockGetAgents: vi.fn(),
  mockInitializeAgentSelection: vi.fn(),
}));

// Mock the stores
vi.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      setAuth: mocks.mockSetAuth,
      setUser: mocks.mockSetUser,
      logout: mocks.mockLogout,
      isAuthenticated: mocks.mockIsAuthenticated(),
      user: mocks.mockUser(),
    }),
  },
}));

// Mock agent service and store
vi.mock('@/features/agents/services/agentService', () => ({
  agentService: {
    getAgents: mocks.mockGetAgents,
  },
}));

vi.mock('@/features/agents/stores/agentStore', () => ({
  useAgentStore: {
    getState: () => ({
      initializeAgentSelection: mocks.mockInitializeAgentSelection,
    }),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the entire api module with test axios instance
vi.mock('@/lib/api', async () => {
  const axios = await import('axios');

  const testApi = axios.default.create({
    baseURL: 'http://localhost:5267',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return {
    default: testApi,
    API_URL: 'http://localhost:5267',
    setTokens: vi.fn(),
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    clearTokens: vi.fn(),
  };
});

// Import after mocks
import { authService } from './authService';

describe('authService', () => {
  const mockUserData: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'SuperAdmin' as any, // API returns string, not enum
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mocks.mockGetAgents.mockResolvedValue([]);
    mocks.mockInitializeAgentSelection.mockResolvedValue(undefined);
  });

  describe('login', () => {
    it('should login successfully and update auth store', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(credentials);

      // Should return properly transformed auth response
      expect(result).toMatchObject({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      });

      // Should update auth store
      expect(mocks.mockSetAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        }),
        'mock-access-token',
        'mock-refresh-token'
      );

      // Should initialize agent data
      expect(mocks.mockGetAgents).toHaveBeenCalledOnce();
      expect(mocks.mockInitializeAgentSelection).toHaveBeenCalledOnce();
    });

    it('should handle login failure', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/login', () => {
          return HttpResponse.json(
            { message: 'Invalid credentials' },
            { status: 401 }
          );
        })
      );

      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'wrongpass',
        })
      ).rejects.toThrow();

      // Should not update auth store on failure
      expect(mocks.mockSetAuth).not.toHaveBeenCalled();
      expect(mocks.mockGetAgents).not.toHaveBeenCalled();
    });

    it('should complete login even if agent initialization fails', async () => {
      mocks.mockGetAgents.mockRejectedValue(new Error('Agent fetch failed'));

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Should still return auth response
      expect(result).toMatchObject({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      });

      // Should still update auth store
      expect(mocks.mockSetAuth).toHaveBeenCalled();

      // Agent initialization should have been attempted
      expect(mocks.mockGetAgents).toHaveBeenCalled();
    });
  });

  describe('loginWithGoogle', () => {
    it('should login with Google OAuth successfully', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/oauth', async ({ request }) => {
          const body = (await request.json()) as any;

          if (body.provider === 'google') {
            return HttpResponse.json({
              access_token: 'google-access-token',
              refresh_token: 'google-refresh-token',
              user: mockUserData,
            });
          }

          return HttpResponse.json({ message: 'Invalid provider' }, { status: 400 });
        })
      );

      const result = await authService.loginWithGoogle('google-oauth-token');

      expect(result).toEqual({
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
        user: mockUserData,
      });

      expect(mocks.mockSetAuth).toHaveBeenCalledWith(
        mockUserData,
        'google-access-token',
        'google-refresh-token'
      );

      expect(mocks.mockGetAgents).toHaveBeenCalledOnce();
    });

    it('should handle Google OAuth failure', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/oauth', () => {
          return HttpResponse.json(
            { message: 'OAuth authentication failed' },
            { status: 401 }
          );
        })
      );

      await expect(
        authService.loginWithGoogle('invalid-token')
      ).rejects.toThrow();

      expect(mocks.mockSetAuth).not.toHaveBeenCalled();
    });
  });

  describe('loginWithApple', () => {
    it('should login with Apple Sign-In successfully', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/oauth', async ({ request }) => {
          const body = (await request.json()) as any;

          if (body.provider === 'apple') {
            return HttpResponse.json({
              access_token: 'apple-access-token',
              refresh_token: 'apple-refresh-token',
              user: mockUserData,
            });
          }

          return HttpResponse.json({ message: 'Invalid provider' }, { status: 400 });
        })
      );

      const result = await authService.loginWithApple('apple-id-token');

      expect(result).toEqual({
        accessToken: 'apple-access-token',
        refreshToken: 'apple-refresh-token',
        user: mockUserData,
      });

      expect(mocks.mockSetAuth).toHaveBeenCalledWith(
        mockUserData,
        'apple-access-token',
        'apple-refresh-token'
      );
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/register', async ({ request }) => {
          const body = (await request.json()) as any;

          return HttpResponse.json({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            user: {
              ...mockUserData,
              email: body.email,
              name: body.name,
            },
          }, { status: 201 });
        })
      );

      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const result = await authService.register(registerData);

      expect(result.user.email).toBe(registerData.email);
      expect(result.user.name).toBe(registerData.name);
      expect(mocks.mockSetAuth).toHaveBeenCalled();
      expect(mocks.mockGetAgents).toHaveBeenCalled();
    });

    it('should handle registration failure for duplicate email', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/register', () => {
          return HttpResponse.json(
            { message: 'Email already exists' },
            { status: 409 }
          );
        })
      );

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Test User',
        })
      ).rejects.toThrow();

      expect(mocks.mockSetAuth).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear auth store', async () => {
      await authService.logout();

      expect(mocks.mockLogout).toHaveBeenCalledOnce();
    });

    it('should clear auth store even if API call fails', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/logout', () => {
          return HttpResponse.json(
            { message: 'Server error' },
            { status: 500 }
          );
        })
      );

      await authService.logout();

      // Should still logout locally
      expect(mocks.mockLogout).toHaveBeenCalledOnce();
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password request successfully', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/forgot-password', () => {
          return HttpResponse.json({ message: 'Password reset email sent' });
        })
      );

      await expect(
        authService.forgotPassword({ email: 'test@example.com' })
      ).resolves.not.toThrow();
    });

    it('should handle forgot password for non-existent email', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/forgot-password', () => {
          return HttpResponse.json(
            { message: 'Email not found' },
            { status: 404 }
          );
        })
      );

      await expect(
        authService.forgotPassword({ email: 'nonexistent@example.com' })
      ).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/reset-password', () => {
          return HttpResponse.json({ message: 'Password reset successful' });
        })
      );

      await expect(
        authService.resetPassword({
          token: 'valid-reset-token',
          newPassword: 'newpassword123',
        })
      ).resolves.not.toThrow();
    });

    it('should handle invalid or expired reset token', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/reset-password', () => {
          return HttpResponse.json(
            { message: 'Invalid or expired token' },
            { status: 400 }
          );
        })
      );

      await expect(
        authService.resetPassword({
          token: 'invalid-token',
          newPassword: 'newpassword123',
        })
      ).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password for authenticated user', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/change-password', () => {
          return HttpResponse.json({ message: 'Password changed successfully' });
        })
      );

      await expect(
        authService.changePassword({
          oldPassword: 'oldpassword123',
          newPassword: 'newpassword123',
        })
      ).resolves.not.toThrow();
    });

    it('should handle incorrect old password', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/change-password', () => {
          return HttpResponse.json(
            { message: 'Old password is incorrect' },
            { status: 400 }
          );
        })
      );

      await expect(
        authService.changePassword({
          oldPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        })
      ).rejects.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user and update store', async () => {
      server.use(
        http.get('http://localhost:5267/api/auth/me', () => {
          return HttpResponse.json(mockUserData);
        })
      );

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUserData);
      expect(mocks.mockSetUser).toHaveBeenCalledWith(mockUserData);
    });

    it('should handle unauthorized request', async () => {
      server.use(
        http.get('http://localhost:5267/api/auth/me', () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      await expect(authService.getCurrentUser()).rejects.toThrow();
      expect(mocks.mockSetUser).not.toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return authentication status from store', () => {
      mocks.mockIsAuthenticated.mockReturnValue(true);

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when not authenticated', () => {
      mocks.mockIsAuthenticated.mockReturnValue(false);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getUser', () => {
    it('should return user from store', () => {
      mocks.mockUser.mockReturnValue(mockUserData);

      const result = authService.getUser();

      expect(result).toEqual(mockUserData);
    });

    it('should return null when no user in store', () => {
      mocks.mockUser.mockReturnValue(null);

      const result = authService.getUser();

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token successfully', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/refresh', () => {
          return HttpResponse.json({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          });
        })
      );

      const result = await authService.refreshToken('old-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should handle invalid refresh token', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/refresh', () => {
          return HttpResponse.json(
            { message: 'Invalid refresh token' },
            { status: 401 }
          );
        })
      );

      await expect(
        authService.refreshToken('invalid-refresh-token')
      ).rejects.toThrow();
    });

    it('should handle expired refresh token', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/refresh', () => {
          return HttpResponse.json(
            { message: 'Refresh token expired' },
            { status: 401 }
          );
        })
      );

      await expect(
        authService.refreshToken('expired-refresh-token')
      ).rejects.toThrow();
    });
  });

  describe('snake_case to camelCase transformation', () => {
    it('should correctly transform login response from snake_case to camelCase', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Ensure backend snake_case is converted to camelCase
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).not.toHaveProperty('access_token');
      expect(result).not.toHaveProperty('refresh_token');
    });
  });
});
