import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
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
  reject: (reason?: any) => void;
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
    clearTokens();
    // Sync Zustand auth state - Critical fix for flickering loop
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
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        // Use centralized authService.refreshToken to avoid code duplication
        const { authService } = await import('@/features/auth/services/authService');
        const tokens = await authService.refreshToken(storedRefreshToken);

        setTokens(tokens.accessToken, tokens.refreshToken);
        processQueue(null, tokens.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
