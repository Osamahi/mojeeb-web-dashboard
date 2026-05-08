import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { getAccessToken, clearTokens } from './tokenStore';
import { env } from '@/config/env';
import { shouldRetry, calculateExponentialDelay, sleep } from './retryConfig';
import { toast } from 'sonner';
import { logger } from './logger';
import i18n from '@/i18n/config';
import { authSession } from './authSession';
import { TerminalAuthError } from '@/features/auth/errors';

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
    //
    // Refresh strategy:
    //   - The actual /api/auth/refresh call is owned by authSession (single
    //     coordinator, dedup'd, idempotent side effects).
    //   - This interceptor still maintains its own `isRefreshing` queue so
    //     that 10 concurrent 401s don't all kick off retries until the first
    //     one's refresh has resolved. The queue is for retry coordination,
    //     not for refresh deduplication.
    //   - Terminal failures (refresh token rejected) → sign out via the
    //     central performLogout. Transient failures (network/5xx) → reject
    //     and preserve session. The next API call will trigger another
    //     refresh attempt.
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

      try {
        const tokens = await authSession.ensureFresh();
        processQueue(null, tokens.accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);

        if (refreshError instanceof TerminalAuthError) {
          // Refresh token is dead. Route through the centralized logout
          // service so all the cleanup (stores, channels, query cache,
          // cross-tab broadcast) happens in one place.
          logger.warn('[API] Refresh token rejected — signing out', {
            reason: refreshError.reason,
          });
          try {
            const { performLogout } = await import('@/features/auth/services/logoutService');
            await performLogout({
              callBackend: false, // backend already rejected us; no point retrying
              redirect: false, // route guards redirect on next navigation
              reason: 'token-invalid',
            });
          } catch (logoutErr) {
            // Belt-and-suspenders: if logoutService import or execution fails,
            // at least clear tokens so the next navigation won't loop.
            logger.error(
              '[API] performLogout failed during terminal auth — clearing tokens directly',
              logoutErr instanceof Error ? logoutErr : new Error(String(logoutErr)),
            );
            clearTokens();
          }
          return Promise.reject(refreshError);
        }

        // Transient: keep the session, surface the error to the caller.
        logger.warn('[API] Refresh failed transiently — session preserved', {
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
