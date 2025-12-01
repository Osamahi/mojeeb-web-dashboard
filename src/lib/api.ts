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

const redirectToLogin = () => {
  if (shouldRedirectToLogin()) {
    lastRedirectTime = Date.now();

    // Clear React Query cache to prevent stale data
    if (globalQueryClient) {
      logger.info('Clearing React Query cache on redirect to login');
      globalQueryClient.clear();
    }

    clearTokens();
    // Sync Zustand auth state - Critical fix for flickering loop
    // This also clears AgentStore and ConversationStore
    useAuthStore.getState().logout();
    window.location.href = '/login';
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
      if (import.meta.env.DEV) {
        console.log(`\n🚨 [API Interceptor] 401 Unauthorized detected at ${new Date().toISOString()}`);
        console.log(`   📍 Request: ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`);
      }

      if (isRefreshing) {
        if (import.meta.env.DEV) {
          console.log(`   ⏳ Refresh already in progress, queuing request (queue size: ${failedQueue.length})`);
        }
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (import.meta.env.DEV) {
              console.log(`   ✅ Queue resolved with new token, retrying request`);
            }
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            if (import.meta.env.DEV) {
              console.error(`   ❌ Queue rejected, request failed`, err);
            }
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      if (import.meta.env.DEV) {
        console.log(`   🔄 Starting token refresh flow...`);
      }

      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        if (import.meta.env.DEV) {
          console.error(`   ❌ No refresh token found! Redirecting to login...`);
        }
        redirectToLogin();
        return Promise.reject(error);
      }

      if (import.meta.env.DEV) {
        console.log(`   ✅ Refresh token found, calling authService.refreshAndUpdateSession()`);
      }

      try {
        // Use centralized refresh method that handles token storage and Supabase auth
        const { authService } = await import('@/features/auth/services/authService');
        const tokens = await authService.refreshAndUpdateSession(storedRefreshToken);

        if (import.meta.env.DEV) {
          console.log(`   📨 Processing queued requests (${failedQueue.length} in queue)...`);
        }
        processQueue(null, tokens.accessToken);
        if (import.meta.env.DEV) {
          console.log(`   ✅ Queue processed`);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        if (import.meta.env.DEV) {
          console.log(`   🔁 Retrying original request with new token...`);
        }
        return api(originalRequest);
      } catch (refreshError) {
        if (import.meta.env.DEV) {
          console.error(`   ❌ [API Interceptor] Token refresh FAILED:`, refreshError);
        }
        processQueue(refreshError as AxiosError, null);
        if (import.meta.env.DEV) {
          console.log(`   🚪 Redirecting to login...`);
        }
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        if (import.meta.env.DEV) {
          console.log(`   🏁 Refresh flow complete, isRefreshing = false`);
        }
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
