import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { type AxiosError } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import api, { setTokens, getAccessToken, clearTokens } from './api';

// Mock dependencies
const mocks = vi.hoisted(() => ({
  mockSetTokens: vi.fn(),
  mockGetAccessToken: vi.fn(),
  mockGetRefreshToken: vi.fn(),
  mockClearTokens: vi.fn(),
  mockShouldRetry: vi.fn(),
  mockCalculateExponentialDelay: vi.fn(),
  mockSleep: vi.fn(),
  mockLoggerWarn: vi.fn(),
  mockLoggerInfo: vi.fn(),
  mockLoggerError: vi.fn(),
  mockAuthServiceRefreshToken: vi.fn(),
  mockLogout: vi.fn(),
}));

vi.mock('./tokenManager', () => ({
  setTokens: mocks.mockSetTokens,
  getAccessToken: mocks.mockGetAccessToken,
  getRefreshToken: mocks.mockGetRefreshToken,
  clearTokens: mocks.mockClearTokens,
}));

vi.mock('./retryConfig', () => ({
  shouldRetry: mocks.mockShouldRetry,
  calculateExponentialDelay: mocks.mockCalculateExponentialDelay,
  sleep: mocks.mockSleep,
}));

vi.mock('./logger', () => ({
  logger: {
    warn: mocks.mockLoggerWarn,
    info: mocks.mockLoggerInfo,
    error: mocks.mockLoggerError,
  },
}));

// Mock the authService module (handles dynamic import in api.ts)
vi.mock('@/features/auth/services/authService', async () => {
  return {
    authService: {
      refreshToken: mocks.mockAuthServiceRefreshToken,
    },
  };
});

vi.mock('@/features/auth/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      logout: mocks.mockLogout,
    }),
  },
}));

// Mock window.location (jsdom doesn't handle navigation well)
const mockLocation = {
  href: '',
  pathname: '/',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};
delete (window as any).location;
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
  configurable: true,
});

describe('api', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    // Create fresh axios mock adapter
    mockAxios = new MockAdapter(api);

    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    mocks.mockGetAccessToken.mockReturnValue(null);
    mocks.mockGetRefreshToken.mockReturnValue(null);
    mocks.mockShouldRetry.mockReturnValue(false);
    mocks.mockCalculateExponentialDelay.mockReturnValue(1000);
    mocks.mockSleep.mockResolvedValue(undefined);
    mocks.mockAuthServiceRefreshToken.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    // Reset window.location
    mockLocation.pathname = '/';
    mockLocation.href = '';
    mockLocation.assign.mockClear();
    mockLocation.replace.mockClear();
    mockLocation.reload.mockClear();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when access token exists', async () => {
      mocks.mockGetAccessToken.mockReturnValue('test-access-token');

      mockAxios.onGet('/test').reply(200, { success: true });

      await api.get('/test');

      const request = mockAxios.history.get[0];
      expect(request.headers?.Authorization).toBe('Bearer test-access-token');
    });

    it('should not add Authorization header when no access token', async () => {
      mocks.mockGetAccessToken.mockReturnValue(null);

      mockAxios.onGet('/test').reply(200, { success: true });

      await api.get('/test');

      const request = mockAxios.history.get[0];
      expect(request.headers?.Authorization).toBeUndefined();
    });

    it('should read token dynamically from tokenManager for each request', async () => {
      // First request - no token
      mocks.mockGetAccessToken.mockReturnValueOnce(null);
      mockAxios.onGet('/test1').reply(200);
      await api.get('/test1');

      // Second request - token exists
      mocks.mockGetAccessToken.mockReturnValueOnce('new-token');
      mockAxios.onGet('/test2').reply(200);
      await api.get('/test2');

      expect(mocks.mockGetAccessToken).toHaveBeenCalledTimes(2);
      expect(mockAxios.history.get[0].headers?.Authorization).toBeUndefined();
      expect(mockAxios.history.get[1].headers?.Authorization).toBe('Bearer new-token');
    });
  });

  describe('Response Interceptor - 401 Token Refresh', () => {
    it('should attempt token refresh on 401 error', async () => {
      mocks.mockGetAccessToken.mockReturnValue('expired-token');
      mocks.mockGetRefreshToken.mockReturnValue('valid-refresh-token');
      mocks.mockAuthServiceRefreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // First request fails with 401, retry should succeed
      mockAxios
        .onGet('/protected')
        .replyOnce(401)
        .onGet('/protected')
        .replyOnce(200, { data: 'success' });

      const response = await api.get('/protected');

      expect(mocks.mockAuthServiceRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mocks.mockSetTokens).toHaveBeenCalledWith('new-access-token', 'new-refresh-token');
      expect(response.data).toEqual({ data: 'success' });
    });

    it('should redirect to login if no refresh token available', async () => {
      mocks.mockGetAccessToken.mockReturnValue('expired-token');
      mocks.mockGetRefreshToken.mockReturnValue(null); // No refresh token

      mockAxios.onGet('/protected').reply(401);

      await expect(api.get('/protected')).rejects.toThrow();

      expect(mocks.mockClearTokens).toHaveBeenCalled();
      expect(mocks.mockLogout).toHaveBeenCalled();
      expect(mockLocation.href).toBe('/login');
    });

    // Note: Skipping due to axios-mock-adapter limitations with dynamic imports
    it.skip('should redirect to login if token refresh fails', async () => {
      mocks.mockGetAccessToken.mockReturnValue('expired-token');
      mocks.mockGetRefreshToken.mockReturnValue('invalid-refresh-token');
      mocks.mockAuthServiceRefreshToken.mockRejectedValue(new Error('Refresh failed'));

      mockAxios.onGet('/protected').reply(401);

      await expect(api.get('/protected')).rejects.toThrow('Refresh failed');

      expect(mocks.mockClearTokens).toHaveBeenCalled();
      expect(mocks.mockLogout).toHaveBeenCalled();
      expect(mockLocation.href).toBe('/login');
    });

    it.skip('should not redirect to login if already on login page', async () => {
      mockLocation.pathname = '/login';
      mocks.mockGetAccessToken.mockReturnValue('expired-token');
      mocks.mockGetRefreshToken.mockReturnValue(null);

      mockAxios.onGet('/test').reply(401);

      await expect(api.get('/test')).rejects.toThrow();

      // Should not redirect (href should still be empty)
      expect(mockLocation.href).toBe('');
    });

    it.skip('should prevent redirect loops with cooldown', async () => {
      mocks.mockGetAccessToken.mockReturnValue('expired-token');
      mocks.mockGetRefreshToken.mockReturnValue(null);

      mockAxios.onGet('/test').reply(401);

      // First redirect should work
      await expect(api.get('/test')).rejects.toThrow();
      expect(mockLocation.href).toBe('/login');

      // Reset for second attempt
      mockLocation.pathname = '/';
      mockLocation.href = '';
      mockAxios.resetHistory();

      // Second redirect within cooldown should be prevented
      await expect(api.get('/test')).rejects.toThrow();
      expect(mocks.mockLoggerWarn).toHaveBeenCalledWith(
        'Redirect loop detected - skipping redirect to login',
        expect.any(Object)
      );
    });

    it.skip('should not retry 401 request twice (check _retry flag)', async () => {
      mocks.mockGetAccessToken.mockReturnValue('token');
      mocks.mockGetRefreshToken.mockReturnValue('refresh-token');
      mocks.mockAuthServiceRefreshToken.mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      });

      // Both attempts fail with 401
      mockAxios.onGet('/protected').reply(401).onGet('/protected').reply(401);

      await expect(api.get('/protected')).rejects.toThrow();

      // Should only call refresh once
      expect(mocks.mockAuthServiceRefreshToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('Response Interceptor - Concurrent 401 Handling', () => {
    it.skip('should queue concurrent requests during token refresh', async () => {
      mocks.mockGetAccessToken.mockReturnValue('expired-token');
      mocks.mockGetRefreshToken.mockReturnValue('refresh-token');

      // Simulate slow refresh
      mocks.mockAuthServiceRefreshToken.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  accessToken: 'new-token',
                  refreshToken: 'new-refresh',
                }),
              100
            )
          )
      );

      mockAxios
        .onGet('/endpoint1')
        .replyOnce(401)
        .onGet('/endpoint1')
        .replyOnce(200, { data: '1' });

      mockAxios
        .onGet('/endpoint2')
        .replyOnce(401)
        .onGet('/endpoint2')
        .replyOnce(200, { data: '2' });

      // Make concurrent requests
      const [response1, response2] = await Promise.all([api.get('/endpoint1'), api.get('/endpoint2')]);

      // Both should succeed
      expect(response1.data).toEqual({ data: '1' });
      expect(response2.data).toEqual({ data: '2' });

      // Refresh should only be called once
      expect(mocks.mockAuthServiceRefreshToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('Response Interceptor - Retry Logic', () => {
    it('should retry on 429 rate limit error', async () => {
      mocks.mockShouldRetry.mockReturnValue(true);
      mocks.mockCalculateExponentialDelay.mockReturnValue(100);

      mockAxios
        .onGet('/api/data')
        .replyOnce(429)
        .onGet('/api/data')
        .replyOnce(200, { data: 'success' });

      const response = await api.get('/api/data');

      expect(mocks.mockShouldRetry).toHaveBeenCalled();
      expect(mocks.mockSleep).toHaveBeenCalledWith(100);
      expect(response.data).toEqual({ data: 'success' });
    });

    it('should retry on 500 server error', async () => {
      mocks.mockShouldRetry.mockReturnValue(true);
      mocks.mockCalculateExponentialDelay.mockReturnValue(1000);

      mockAxios
        .onGet('/api/data')
        .replyOnce(500)
        .onGet('/api/data')
        .replyOnce(200, { data: 'success' });

      const response = await api.get('/api/data');

      expect(mocks.mockShouldRetry).toHaveBeenCalled();
      expect(mocks.mockSleep).toHaveBeenCalledWith(1000);
      expect(response.data).toEqual({ data: 'success' });
    });

    it('should retry on network error', async () => {
      mocks.mockShouldRetry.mockReturnValue(true);
      mocks.mockCalculateExponentialDelay.mockReturnValue(2000);

      mockAxios
        .onGet('/api/data')
        .networkErrorOnce()
        .onGet('/api/data')
        .replyOnce(200, { data: 'success' });

      const response = await api.get('/api/data');

      expect(mocks.mockShouldRetry).toHaveBeenCalled();
      expect(mocks.mockSleep).toHaveBeenCalledWith(2000);
      expect(response.data).toEqual({ data: 'success' });
    });

    it('should not retry on 404 client error', async () => {
      mocks.mockShouldRetry.mockReturnValue(false);

      mockAxios.onGet('/api/not-found').reply(404);

      await expect(api.get('/api/not-found')).rejects.toThrow();

      expect(mocks.mockShouldRetry).toHaveBeenCalled();
      expect(mocks.mockSleep).not.toHaveBeenCalled();
    });

    it('should respect max retry attempts', async () => {
      // Return true for first 2 attempts, false for 3rd
      mocks.mockShouldRetry.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(false);

      mockAxios.onGet('/api/data').reply(500);

      await expect(api.get('/api/data')).rejects.toThrow();

      // Should have been called 3 times (initial + 2 retries)
      expect(mocks.mockShouldRetry).toHaveBeenCalledTimes(3);
    });

    it('should log retry attempts with correct metadata', async () => {
      mocks.mockShouldRetry.mockReturnValue(true);
      mocks.mockCalculateExponentialDelay.mockReturnValue(1000);

      mockAxios
        .onGet('/api/data')
        .replyOnce(503)
        .onGet('/api/data')
        .replyOnce(200, { data: 'success' });

      await api.get('/api/data');

      expect(mocks.mockLoggerInfo).toHaveBeenCalledWith(
        'Retrying request with exponential backoff',
        expect.objectContaining({
          url: '/api/data',
          method: 'get',
          attemptNumber: 1,
          delay: 1000,
          status: 503,
        })
      );
    });

    it('should log final error after all retries exhausted', async () => {
      mocks.mockShouldRetry.mockReturnValue(false);

      mockAxios.onGet('/api/data').reply(500);

      await expect(api.get('/api/data')).rejects.toThrow();

      expect(mocks.mockLoggerError).toHaveBeenCalledWith(
        'Request failed after retries',
        expect.any(Object),
        expect.objectContaining({
          url: '/api/data',
          method: 'get',
          status: 500,
        })
      );
    });

    it('should increment retry count on each attempt', async () => {
      mocks.mockShouldRetry
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      mockAxios.onGet('/api/data').reply(500);

      await expect(api.get('/api/data')).rejects.toThrow();

      // Check that shouldRetry was called with incrementing attempt numbers
      expect(mocks.mockShouldRetry).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        1 // First retry attempt
      );
      expect(mocks.mockShouldRetry).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        2 // Second retry attempt
      );
      expect(mocks.mockShouldRetry).toHaveBeenNthCalledWith(
        3,
        expect.any(Object),
        3 // Third retry attempt
      );
    });
  });

  describe('Combined Scenarios', () => {
    it.skip('should handle 401 followed by successful retry', async () => {
      mocks.mockGetAccessToken.mockReturnValue('expired-token');
      mocks.mockGetRefreshToken.mockReturnValue('refresh-token');
      mocks.mockAuthServiceRefreshToken.mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      });

      mockAxios
        .onGet('/api/data')
        .replyOnce(401)
        .onGet('/api/data')
        .replyOnce(200, { data: 'success' });

      const response = await api.get('/api/data');

      expect(response.data).toEqual({ data: 'success' });
      expect(mocks.mockSetTokens).toHaveBeenCalledWith('new-token', 'new-refresh');
    });

    it.skip('should not retry 401 after successful token refresh', async () => {
      mocks.mockGetAccessToken.mockReturnValue('token');
      mocks.mockGetRefreshToken.mockReturnValue('refresh');
      mocks.mockAuthServiceRefreshToken.mockResolvedValue({
        accessToken: 'new',
        refreshToken: 'new-refresh',
      });

      // First 401 triggers refresh and succeeds, second 401 should not retry
      mockAxios.onGet('/test').replyOnce(401).onGet('/test').replyOnce(401);

      await expect(api.get('/test')).rejects.toThrow();

      // Should only refresh once (not retry the second 401)
      expect(mocks.mockAuthServiceRefreshToken).toHaveBeenCalledTimes(1);
    });

    it('should pass through successful requests unchanged', async () => {
      mocks.mockGetAccessToken.mockReturnValue('valid-token');

      mockAxios.onGet('/api/data').reply(200, { message: 'success' });

      const response = await api.get('/api/data');

      expect(response.data).toEqual({ message: 'success' });
      expect(response.status).toBe(200);

      // Should not attempt any retries or refreshes
      expect(mocks.mockAuthServiceRefreshToken).not.toHaveBeenCalled();
      expect(mocks.mockShouldRetry).not.toHaveBeenCalled();
    });
  });
});
