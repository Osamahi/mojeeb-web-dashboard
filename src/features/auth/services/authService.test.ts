import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { User } from '../types/auth.types';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

// Hoist mocks to avoid initialization errors
const mocks = vi.hoisted(() => ({
  mockSetAuth: vi.fn(),
  mockSetUser: vi.fn(),
  mockIsAuthenticated: vi.fn(() => false),
  mockUser: vi.fn(() => null),
}));

// Mock the auth store. Logout is intentionally not stubbed here — these tests
// don't exercise logout (logoutService has its own surface).
vi.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      setAuth: mocks.mockSetAuth,
      setUser: mocks.mockSetUser,
      isAuthenticated: mocks.mockIsAuthenticated(),
      user: mocks.mockUser(),
    }),
  },
}));

// Stub agent service and store. authService.completeAuthFlow imports them at
// module load — the stubs prevent ReferenceError; tests here don't exercise
// completeAuthFlow so the inner functions stay no-op.
vi.mock('@/features/agents/services/agentService', () => ({
  agentService: {
    getAgents: vi.fn(),
  },
}));

vi.mock('@/features/agents/stores/agentStore', () => ({
  useAgentStore: {
    getState: () => ({
      setGlobalSelectedAgent: vi.fn(),
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
  // What the BACKEND returns — snake_case, the wire shape consumed by transformUser.
  const apiUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'SuperAdmin' as const,
    phone: undefined,
    avatar_url: undefined,
    created_at: '2026-05-08T08:00:00.000Z',
    updated_at: '2026-05-08T08:00:00.000Z',
    o_auth_provider: undefined,
    o_auth_provider_user_id: undefined,
  };

  // What the FRONTEND expects after transformUser maps the wire shape.
  const expectedUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'SuperAdmin' as any, // API returns string, not enum value
    phone: undefined,
    avatarUrl: undefined,
    createdAt: '2026-05-08T08:00:00.000Z',
    updatedAt: '2026-05-08T08:00:00.000Z',
    oauthProvider: undefined,
    oauthProviderUserId: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Note: login/oauth/register only authenticate the user and write tokens.
  // Post-auth steps (agent fetch, agent selection, navigation) are handled by
  // the `usePostAuthNavigation` hook calling `authService.completeAuthFlow`.
  // The agent-related assertions belong in completeAuthFlow tests.

  describe('login', () => {
    it('should login successfully and update auth store', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: expectedUser,
      });

      expect(mocks.mockSetAuth).toHaveBeenCalledWith(
        expectedUser,
        'mock-access-token',
        'mock-refresh-token',
      );
    });

    it('should handle login failure', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/login', () => {
          return HttpResponse.json(
            { message: 'Invalid credentials' },
            { status: 401 },
          );
        }),
      );

      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'wrongpass',
        }),
      ).rejects.toThrow();

      expect(mocks.mockSetAuth).not.toHaveBeenCalled();
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
              user: apiUser,
            });
          }

          return HttpResponse.json({ message: 'Invalid provider' }, { status: 400 });
        }),
      );

      const result = await authService.loginWithGoogle(
        'google-oauth-token',
        apiUser.email,
        apiUser.name,
        '',
      );

      expect(result).toEqual({
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
        user: expectedUser,
      });

      expect(mocks.mockSetAuth).toHaveBeenCalledWith(
        expectedUser,
        'google-access-token',
        'google-refresh-token',
      );
    });

    it('should handle Google OAuth failure', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/oauth', () => {
          return HttpResponse.json(
            { message: 'OAuth authentication failed' },
            { status: 401 },
          );
        }),
      );

      await expect(
        authService.loginWithGoogle('invalid-token', apiUser.email, apiUser.name, ''),
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
              user: apiUser,
            });
          }

          return HttpResponse.json({ message: 'Invalid provider' }, { status: 400 });
        }),
      );

      const result = await authService.loginWithApple('apple-id-token');

      expect(result).toEqual({
        accessToken: 'apple-access-token',
        refreshToken: 'apple-refresh-token',
        user: expectedUser,
      });

      expect(mocks.mockSetAuth).toHaveBeenCalledWith(
        expectedUser,
        'apple-access-token',
        'apple-refresh-token',
      );
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/register', async ({ request }) => {
          const body = (await request.json()) as any;

          return HttpResponse.json(
            {
              access_token: 'new-access-token',
              refresh_token: 'new-refresh-token',
              user: {
                ...apiUser,
                email: body.email,
                name: body.name,
              },
            },
            { status: 201 },
          );
        }),
      );

      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const result = await authService.register(registerData);

      expect(result.user.email).toBe(registerData.email);
      expect(result.user.name).toBe(registerData.name);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mocks.mockSetAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerData.email,
          name: registerData.name,
        }),
        'new-access-token',
        'new-refresh-token',
      );
    });

    it('should handle registration failure for duplicate email', async () => {
      server.use(
        http.post('http://localhost:5267/api/auth/register', () => {
          return HttpResponse.json(
            { message: 'Email already exists' },
            { status: 409 },
          );
        }),
      );

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow();

      expect(mocks.mockSetAuth).not.toHaveBeenCalled();
    });
  });

  // Logout no longer lives on authService — it's owned by features/auth/services/logoutService
  // (orchestrates the 15-step cleanup) and exposed via useAuthStore.getState().logout().
  // Logout tests should target performLogout directly in a logoutService test file.

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
          return HttpResponse.json(apiUser);
        }),
      );

      const result = await authService.getCurrentUser();

      expect(result).toEqual(expectedUser);
      expect(mocks.mockSetUser).toHaveBeenCalledWith(expectedUser);
    });

    it('should handle unauthorized request', async () => {
      server.use(
        http.get('http://localhost:5267/api/auth/me', () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 401 },
          );
        }),
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
      mocks.mockUser.mockReturnValue(expectedUser);

      const result = authService.getUser();

      expect(result).toEqual(expectedUser);
    });

    it('should return null when no user in store', () => {
      mocks.mockUser.mockReturnValue(null);

      const result = authService.getUser();

      expect(result).toBeNull();
    });
  });

  // Token refresh tests moved to lib/authSession.test.ts — refresh ownership
  // was extracted from authService into the authSession coordinator.

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
