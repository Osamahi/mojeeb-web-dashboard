import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from './tokenStore';
import { env } from '@/config/env';
import { shouldRetry, calculateExponentialDelay, sleep } from './retryConfig';
import { toast } from 'sonner';
import { logger } from './logger';
import i18n from '@/i18n/config';

// Re-export token accessors for back-compat with existing imports.
export { setTokens, getAccessToken, getRefreshToken, clearTokens };

export const API_URL = env.VITE_API_URL;
const API_TIMEOUT = env.VITE_API_TIMEOUT;

// Global QueryClient instance for cache clearing on logout.
let globalQueryClient: QueryClient | null = null;

export const setGlobalQueryClient = (client: QueryClient) => {
  globalQueryClient = client;
  logger.info('Global QueryClient registered in API interceptor');
};

export const getGlobalQueryClient = (): QueryClient | null => globalQueryClient;

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — just attach the current in-memory access token.
// No proactive expiry check: we let the backend tell us via 401 if it's bad.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData uploads need axios to set Content-Type (with boundary) itself.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — refresh on 401, queue concurrent requests during
// refresh, retry transient 429/5xx with backoff.
//
// The refresh queue matters: when a page loads and fires 10 queries in parallel,
// all 10 hit 401 simultaneously. Without a queue we'd /refresh 10 times.
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // --- 401: refresh flow ---
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Another request is already refreshing — queue this one.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // No refresh token to work with — nothing to do but reject. The route
        // guards will redirect on the next navigation; we do NOT force-redirect
        // here, to avoid blowing users out of their current page on transient
        // background 401s.
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Dynamic import avoids a circular dep with authService → api.
        const { authService } = await import('@/features/auth/services/authService');
        const tokens = await authService.refreshAndUpdateSession(refreshToken);

        processQueue(null, tokens.accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh itself failed — refresh token is invalid/expired/revoked, or
        // the backend is down. Clear tokens and let the caller reject; route
        // guards will redirect to /login on the next navigation.
        processQueue(refreshError as AxiosError, null);
        clearTokens();
        // Also null the store so guards see the change.
        try {
          const { useAuthStore } = await import('@/features/auth/stores/authStore');
          useAuthStore.setState({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            user: null,
          });
        } catch {
          // ignore — tokens are already cleared from storage
        }
        logger.warn('[API] Token refresh failed — session cleared', {
          error: refreshError instanceof Error ? refreshError.message : String(refreshError),
        });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // --- Retryable errors (429 / 5xx / network) with exponential backoff ---
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
      await sleep(delay);
      return api(originalRequest);
    }

    // --- 403: centralized permission-denied toast ---
    const status = error.response?.status;
    if (status === 403) {
      const apiMessage = (error.response?.data as { message?: string } | undefined)?.message;
      toast.error(apiMessage || i18n.t('errors.permission_denied'));
      (error as unknown as { _toastHandled: boolean })._toastHandled = true;
    }

    // --- Logging ---
    const logDetails = {
      url: originalRequest.url,
      method: originalRequest.method,
      status,
      retryCount: originalRequest._retryCount,
    };
    if (status && status >= 400 && status < 500) {
      logger.info('Request failed with client error', logDetails);
    } else {
      logger.error('Request failed after retries', error, logDetails);
    }

    return Promise.reject(error);
  }
);

export default api;
