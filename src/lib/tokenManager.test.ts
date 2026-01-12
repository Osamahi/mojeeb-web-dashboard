import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock logger to avoid console noise
vi.mock('./logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the env config to avoid import.meta.env issues
vi.mock('@/config/env', () => ({
  env: {
    VITE_API_URL: 'http://localhost:5000',
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'eyJtest',
    VITE_TOKEN_ENCRYPTION_KEY: undefined, // Test without encryption key to use fallback
  },
}));

// Mock SecureLS - simulate encryption/decryption that might fail
vi.mock('secure-ls', () => {
  return {
    default: class SecureLS {
      private storage: Map<string, string>;

      constructor() {
        this.storage = new Map();
      }

      get(key: string) {
        return this.storage.get(key) || null;
      }

      set(key: string, value: string) {
        this.storage.set(key, value);
      }

      remove(key: string) {
        this.storage.delete(key);
      }
    },
  };
});

import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  hasTokens,
  hasValidSession,
} from './tokenManager';

describe('tokenManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('setTokens', () => {
    it('should store both access and refresh tokens', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      setTokens(accessToken, refreshToken);

      expect(getAccessToken()).toBe(accessToken);
      expect(getRefreshToken()).toBe(refreshToken);
    });

    it('should overwrite existing tokens', () => {
      setTokens('old-access', 'old-refresh');
      setTokens('new-access', 'new-refresh');

      expect(getAccessToken()).toBe('new-access');
      expect(getRefreshToken()).toBe('new-refresh');
    });

    it('should handle empty strings', () => {
      setTokens('', '');

      // Empty strings are falsy, so functions return null
      expect(getAccessToken()).toBeFalsy();
      expect(getRefreshToken()).toBeFalsy();
    });
  });

  describe('getAccessToken', () => {
    it('should return null when no token is set', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('should return the stored access token', () => {
      const accessToken = 'test-access-token';
      setTokens(accessToken, 'test-refresh-token');

      expect(getAccessToken()).toBe(accessToken);
    });

    it('should return null after tokens are cleared', () => {
      setTokens('test-access', 'test-refresh');
      clearTokens();

      expect(getAccessToken()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return null when no token is set', () => {
      expect(getRefreshToken()).toBeNull();
    });

    it('should return the stored refresh token', () => {
      const refreshToken = 'test-refresh-token';
      setTokens('test-access-token', refreshToken);

      expect(getRefreshToken()).toBe(refreshToken);
    });

    it('should return null after tokens are cleared', () => {
      setTokens('test-access', 'test-refresh');
      clearTokens();

      expect(getRefreshToken()).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should remove both tokens from storage', () => {
      setTokens('test-access', 'test-refresh');
      clearTokens();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it('should not throw error when called multiple times', () => {
      setTokens('test-access', 'test-refresh');

      expect(() => {
        clearTokens();
        clearTokens();
      }).not.toThrow();
    });

    it('should not throw error when no tokens exist', () => {
      expect(() => {
        clearTokens();
      }).not.toThrow();
    });
  });

  describe('hasTokens', () => {
    it('should return false when no tokens are set', () => {
      expect(hasTokens()).toBe(false);
    });

    it('should return true when refresh token exists', () => {
      setTokens('test-access', 'test-refresh');

      expect(hasTokens()).toBe(true);
    });

    it('should return true even if only refresh token exists', () => {
      setTokens('', 'test-refresh');

      expect(hasTokens()).toBe(true);
    });

    it('should return false after tokens are cleared', () => {
      setTokens('test-access', 'test-refresh');
      clearTokens();

      expect(hasTokens()).toBe(false);
    });
  });

  describe('hasValidSession', () => {
    it('should return false when no tokens are set', () => {
      expect(hasValidSession()).toBe(false);
    });

    it('should return true when both tokens exist', () => {
      setTokens('test-access', 'test-refresh');

      expect(hasValidSession()).toBe(true);
    });

    it('should return false when only access token exists', () => {
      setTokens('test-access', '');

      expect(hasValidSession()).toBe(false);
    });

    it('should return false when only refresh token exists', () => {
      setTokens('', 'test-refresh');

      expect(hasValidSession()).toBe(false);
    });

    it('should return false after tokens are cleared', () => {
      setTokens('test-access', 'test-refresh');
      clearTokens();

      expect(hasValidSession()).toBe(false);
    });
  });

  describe('encryption fallback', () => {
    it('should store tokens even if encryption fails', () => {
      // This test verifies the fallback mechanism
      // In real scenarios, SecureLS might fail in some browsers
      const accessToken = 'test-access';
      const refreshToken = 'test-refresh';

      setTokens(accessToken, refreshToken);

      // Tokens should still be accessible
      expect(getAccessToken()).toBeTruthy();
      expect(getRefreshToken()).toBeTruthy();
    });
  });

  describe('token persistence', () => {
    it('should persist tokens across multiple get operations', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      setTokens(accessToken, refreshToken);

      // Call multiple times
      expect(getAccessToken()).toBe(accessToken);
      expect(getAccessToken()).toBe(accessToken);
      expect(getRefreshToken()).toBe(refreshToken);
      expect(getRefreshToken()).toBe(refreshToken);
    });

    it('should maintain token integrity', () => {
      const longAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const longRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      setTokens(longAccessToken, longRefreshToken);

      expect(getAccessToken()).toBe(longAccessToken);
      expect(getRefreshToken()).toBe(longRefreshToken);
    });
  });
});
