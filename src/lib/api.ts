import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from './tokenManager';
import { env } from '@/config/env';
import { shouldRetry, calculateExponentialDelay, sleep } from './retryConfig';
import { logger } from './logger';

// Re-export token management functions for backward compatibility
export { setTokens, getAccessToken, getRefreshToken, clearTokens };

// Export API_URL for use in other modules (e.g., AuthInitializer)
export const API_URL = env.VITE_API_URL;
const API_TIMEOUT = env.VITE_API_TIMEOUT;

// Global QueryClient instance for cache clearing on logout
let globalQueryClient: QueryClient | null = null;

export const setGlobalQueryClient = (client: QueryClient) => {
  globalQueryClient = client;
  logger.info('Global QueryClient registered in API interceptor');
};

export const getGlobalQueryClient = (): QueryClient | null => {
  return globalQueryClient;
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token (read from localStorage each time to avoid race conditions)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: AxiosError) => void;
}> = [];

// Prevent redirect loops
let lastRedirectTime = 0;
const REDIRECT_COOLDOWN = 5000; // 5 seconds

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const shouldRedirectToLogin = (): boolean => {
  const now = Date.now();
  const timeSinceLastRedirect = now - lastRedirectTime;

  // Prevent redirect if already on login page
  if (window.location.pathname === '/login') {
    return false;
  }

  // Prevent redirect if we just redirected recently (redirect loop protection)
  if (timeSinceLastRedirect < REDIRECT_COOLDOWN) {
    logger.warn('Redirect loop detected - skipping redirect to login', {
      timeSinceLastRedirect,
      cooldown: REDIRECT_COOLDOWN,
    });
    return false;
  }

  return true;
};

const redirectToLogin = async () => {
  if (shouldRedirectToLogin()) {
    lastRedirectTime = Date.now();

    // Use centralized logout service for consistent cleanup
    // Dynamic import to avoid circular dependencies
    const { performLogout } = await import('@/features/auth/services/logoutService');

    await performLogout({
      callBackend: false, // Don't call backend - we already got 401, server knows session is invalid
      redirect: true,
      redirectUrl: '/login',
      reason: 'token-expired',
    });
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Initialize retry count if not present
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // If 401 and not already retried, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      logger.debug(`[API Interceptor] 401 Unauthorized detected - ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`);

      if (isRefreshing) {
        logger.debug(`[API Interceptor] Refresh in progress, queuing request (queue size: ${failedQueue.length})`);
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            logger.debug('[API Interceptor] Queue resolved, retrying request');
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            logger.debug('[API Interceptor] Queue rejected', err);
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      logger.debug('[API Interceptor] Starting token refresh flow');

      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        logger.debug('[API Interceptor] No refresh token found, redirecting to login');
        redirectToLogin();
        return Promise.reject(error);
      }

      logger.debug('[API Interceptor] Refresh token found, calling authService');

      try {
        // Use centralized refresh method that handles token storage and Supabase auth
        const { authService } = await import('@/features/auth/services/authService');

        logger.info('[API Interceptor] Attempting token refresh', {
          refreshTokenLength: storedRefreshToken.length,
          timestamp: new Date().toISOString(),
        });

        const tokens = await authService.refreshAndUpdateSession(storedRefreshToken);

        logger.info('[API Interceptor] Token refresh successful', {
          accessTokenLength: tokens.accessToken.length,
          refreshTokenLength: tokens.refreshToken.length,
          queueSize: failedQueue.length,
        });

        logger.debug(`[API Interceptor] Processing queued requests (${failedQueue.length} in queue)`);
        processQueue(null, tokens.accessToken);
        logger.debug('[API Interceptor] Queue processed');

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        logger.debug('[API Interceptor] Retrying original request with new token');
        return api(originalRequest);
      } catch (refreshError) {
        logger.error('[API Interceptor] Token refresh failed - will redirect to login', refreshError instanceof Error ? refreshError : new Error(String(refreshError)), {
          refreshTokenLength: storedRefreshToken.length,
          errorType: refreshError instanceof Error ? refreshError.name : 'Unknown',
          timestamp: new Date().toISOString(),
        });

        processQueue(refreshError as AxiosError, null);
        logger.debug('[API Interceptor] Redirecting to login');
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        logger.debug('[API Interceptor] Refresh flow complete');
      }
    }

    // Handle retryable errors with exponential backoff (429, 5xx, network errors)
    const attemptNumber = originalRequest._retryCount + 1;

    if (shouldRetry(error, attemptNumber)) {
      originalRequest._retryCount = attemptNumber;

      const delay = calculateExponentialDelay(attemptNumber - 1);

      logger.info('Retrying request with exponential backoff', {
        url: originalRequest.url,
        method: originalRequest.method,
        attemptNumber,
        delay,
        status: error.response?.status,
      });

      // Wait for the calculated delay
      await sleep(delay);

      // Retry the request
      return api(originalRequest);
    }

    // If we get here, either:
    // 1. Error is not retryable (4xx client error)
    // 2. Max retries exceeded
    // 3. Other non-retryable condition
    logger.error('Request failed after retries', error, {
      url: originalRequest.url,
      method: originalRequest.method,
      status: error.response?.status,
      retryCount: originalRequest._retryCount,
    });

    return Promise.reject(error);
  }
);

export default api;
