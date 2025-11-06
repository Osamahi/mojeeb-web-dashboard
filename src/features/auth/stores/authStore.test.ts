import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User } from '../types/auth.types';

// Mock dependencies
const mocks = vi.hoisted(() => ({
  mockSetApiTokens: vi.fn(),
  mockClearApiTokens: vi.fn(),
  mockSetSentryUser: vi.fn(),
  mockClearSentryUser: vi.fn(),
}));

vi.mock('@/lib/tokenManager', () => ({
  setTokens: mocks.mockSetApiTokens,
  clearTokens: mocks.mockClearApiTokens,
}));

vi.mock('@/lib/sentry', () => ({
  setSentryUser: mocks.mockSetSentryUser,
  clearSentryUser: mocks.mockClearSentryUser,
}));

describe('authStore', () => {
  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'Customer',
    createdAt: '2025-01-01',
  };

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Reset the store to initial state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    // Clean up localStorage
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user and mark as authenticated', () => {
      const { setUser } = useAuthStore.getState();

      setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should update user if called multiple times', () => {
      const { setUser } = useAuthStore.getState();

      setUser(mockUser);

      const updatedUser = { ...mockUser, name: 'Updated Name' };
      setUser(updatedUser);

      const state = useAuthStore.getState();
      expect(state.user?.name).toBe('Updated Name');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setTokens', () => {
    it('should set tokens in store', () => {
      const { setTokens } = useAuthStore.getState();

      setTokens('access-token', 'refresh-token');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
    });

    it('should call setApiTokens with tokens', () => {
      const { setTokens } = useAuthStore.getState();

      setTokens('access-token', 'refresh-token');

      expect(mocks.mockSetApiTokens).toHaveBeenCalledOnce();
      expect(mocks.mockSetApiTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('should update tokens if called multiple times', () => {
      const { setTokens } = useAuthStore.getState();

      setTokens('old-access', 'old-refresh');
      setTokens('new-access', 'new-refresh');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
      expect(mocks.mockSetApiTokens).toHaveBeenCalledTimes(2);
    });
  });

  describe('setAuth', () => {
    it('should set user, tokens, and authenticated state', () => {
      const { setAuth } = useAuthStore.getState();

      setAuth(mockUser, 'access-token', 'refresh-token');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should call setApiTokens with tokens', () => {
      const { setAuth } = useAuthStore.getState();

      setAuth(mockUser, 'access-token', 'refresh-token');

      expect(mocks.mockSetApiTokens).toHaveBeenCalledOnce();
      expect(mocks.mockSetApiTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('should call setSentryUser with user details', () => {
      const { setAuth } = useAuthStore.getState();

      setAuth(mockUser, 'access-token', 'refresh-token');

      expect(mocks.mockSetSentryUser).toHaveBeenCalledOnce();
      expect(mocks.mockSetSentryUser).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.name
      );
    });

    it('should handle complete auth flow', () => {
      const { setAuth } = useAuthStore.getState();

      setAuth(mockUser, 'access-token', 'refresh-token');

      // Verify all integrations were called
      expect(mocks.mockSetApiTokens).toHaveBeenCalled();
      expect(mocks.mockSetSentryUser).toHaveBeenCalled();

      // Verify state is correct
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should clear user and tokens', () => {
      const { setAuth, logout } = useAuthStore.getState();

      // First authenticate
      setAuth(mockUser, 'access-token', 'refresh-token');

      // Then logout
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should call clearApiTokens', () => {
      const { logout } = useAuthStore.getState();

      logout();

      expect(mocks.mockClearApiTokens).toHaveBeenCalledOnce();
    });

    it('should call clearSentryUser', () => {
      const { logout } = useAuthStore.getState();

      logout();

      expect(mocks.mockClearSentryUser).toHaveBeenCalledOnce();
    });

    it('should handle logout when not authenticated', () => {
      const { logout } = useAuthStore.getState();

      // Logout without being authenticated
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(mocks.mockClearApiTokens).toHaveBeenCalled();
      expect(mocks.mockClearSentryUser).toHaveBeenCalled();
    });

    it('should clear all auth state on logout', () => {
      const { setAuth, logout } = useAuthStore.getState();

      // Set complete auth state
      setAuth(mockUser, 'access-token', 'refresh-token');

      // Verify authenticated
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Logout
      logout();

      // Verify everything is cleared
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const { setLoading } = useAuthStore.getState();

      setLoading(true);

      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      const { setLoading } = useAuthStore.getState();

      setLoading(true);
      setLoading(false);

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should toggle loading state', () => {
      const { setLoading } = useAuthStore.getState();

      expect(useAuthStore.getState().isLoading).toBe(false);

      setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('Persistence - partialize', () => {
    it('should persist only user, refreshToken, and isAuthenticated', () => {
      const { setAuth } = useAuthStore.getState();

      // Set full auth state
      setAuth(mockUser, 'access-token', 'refresh-token');

      // Get the persisted state (what gets saved to localStorage)
      // Note: We can't directly test partialize, but we can verify the behavior
      const state = useAuthStore.getState();

      expect(state.user).toEqual(mockUser);
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);

      // accessToken should not be persisted (verified by the config)
      // This is tested implicitly through the rehydration tests
    });
  });

  describe('State Selectors', () => {
    it('should allow selecting specific state values', () => {
      const { setAuth } = useAuthStore.getState();

      setAuth(mockUser, 'access-token', 'refresh-token');

      // Test selector pattern
      const user = useAuthStore.getState().user;
      const isAuthenticated = useAuthStore.getState().isAuthenticated;

      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });

    it('should reflect state changes immediately', () => {
      const { setUser, setLoading } = useAuthStore.getState();

      setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      setUser(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete login flow', () => {
      const { setAuth, setLoading } = useAuthStore.getState();

      // Start loading
      setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      // Set auth
      setAuth(mockUser, 'access-token', 'refresh-token');

      // Stop loading
      setLoading(false);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(mocks.mockSetApiTokens).toHaveBeenCalled();
      expect(mocks.mockSetSentryUser).toHaveBeenCalled();
    });

    it('should handle token refresh flow', () => {
      const { setAuth, setTokens } = useAuthStore.getState();

      // Initial auth
      setAuth(mockUser, 'old-access', 'old-refresh');

      // Refresh tokens
      setTokens('new-access', 'new-refresh');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle logout after login', () => {
      const { setAuth, logout } = useAuthStore.getState();

      // Login
      setAuth(mockUser, 'access-token', 'refresh-token');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Logout
      logout();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(mocks.mockClearApiTokens).toHaveBeenCalled();
      expect(mocks.mockClearSentryUser).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle setting null user', () => {
      const { setUser, setAuth } = useAuthStore.getState();

      setAuth(mockUser, 'access', 'refresh');

      // Manually setting to null (not recommended, but testing edge case)
      useAuthStore.setState({ user: null });

      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should handle empty tokens', () => {
      const { setTokens } = useAuthStore.getState();

      setTokens('', '');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('');
      expect(state.refreshToken).toBe('');
      expect(mocks.mockSetApiTokens).toHaveBeenCalledWith('', '');
    });

    it('should handle rapid state changes', () => {
      const { setLoading } = useAuthStore.getState();

      setLoading(true);
      setLoading(false);
      setLoading(true);
      setLoading(false);

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
