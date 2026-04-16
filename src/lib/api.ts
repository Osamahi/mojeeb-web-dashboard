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
import { toast } from 'sonner';
import { logger } from './logger';
import { isTokenExpired, decodeJWT } from '@/features/auth/utils/tokenUtils';
import i18n from '@/i18n/config';

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

// Request interceptor - Add JWT token and check expiration
// This provides a defensive layer to prevent 401 errors from expired tokens
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = getAccessToken();
    const refreshToken = getRefreshToken();

    // If token exists, check if it's expired
    if (token && isTokenExpired(token)) {
      logger.info('[API Interceptor] Access token expired, attempting refresh before request');

      // If we have a refresh token, try to get a new access token
      if (refreshToken) {
        try {
          // Import authService dynamically to avoid circular dependency
          const { authService } = await import('@/features/auth/services/authService');

          // Refresh the token
          const newTokens = await authService.refreshAndUpdateSession(refreshToken);

          // Use the new token for this request
          token = newTokens.accessToken;

          logger.info('[API Interceptor] Token refreshed successfully before request');
        } catch (error) {
          logger.error('[API Interceptor] Failed to refresh expired token', error);
          // Don't reject here - let the request proceed and let the response interceptor handle 401
          // This prevents double logout if the refresh token is also invalid
        }
      } else {
        logger.warn('[API Interceptor] No refresh token available for expired access token');
      }
    }

    // Add token to request if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let axios set the correct Content-Type (with boundary) for FormData uploads
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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

/**
 * Snapshot everything that might help diagnose an auth failure.
 * Safe to call in any environment (no secrets are logged — token values are
 * reduced to length + expiry, never the raw string).
 *
 * Logged fields:
 *  - request      : method/URL/status that triggered the failure (null for authStore scenario)
 *  - authStore    : what zustand thinks the auth state is right now
 *  - tokens       : presence + expiry diagnostics (NEVER the actual token)
 *  - page         : where the user currently is (route + visibility)
 *  - browser      : UA + online state + approximate clock (catches clock skew)
 *  - timing       : how long the refresh attempt took, if any
 */
const buildAuthDiagnostics = (opts: {
  scenario: 'A_no_refresh_token' | 'B_refresh_failed' | 'C_rehydration_validation_failed';
  request?: AxiosError['config'] | null;
  status?: number;
  refreshDurationMs?: number;
  extra?: Record<string, unknown>;
}) => {
  const now = Date.now();

  // --- Token presence + expiry (no secrets in output) ---
  const access = getAccessToken();
  const refresh = getRefreshToken();

  let accessExp: string | null = null;
  let accessRemainingMs: number | null = null;
  if (access) {
    try {
      const payload = decodeJWT(access);
      if (payload?.exp) {
        accessExp = new Date(payload.exp * 1000).toISOString();
        accessRemainingMs = payload.exp * 1000 - now;
      }
    } catch { /* ignore */ }
  }
  // NOTE: Refresh tokens in this app are OPAQUE base64url random strings
  // (see MojeebBackEnd/Controllers/AuthController.cs::GenerateRefreshToken),
  // NOT JWTs. They have no client-decodable expiry — that's tracked server-side
  // in the `refresh_tokens` table. So we only report structural diagnostics.
  const refreshLooksOpaque = !!refresh && !refresh.includes('.');

  // --- Zustand store snapshot (no tokens, no PII beyond user id/email which are already in Sentry) ---
  let storeSnapshot: Record<string, unknown> = { error: 'not-available' };
  try {
    const s = useAuthStore.getState();
    storeSnapshot = {
      isAuthenticated: s.isAuthenticated,
      hasUser: !!s.user,
      userId: s.user?.id ?? null,
      userEmail: s.user?.email ?? null,
      storeHasAccessToken: !!s.accessToken,
      storeHasRefreshToken: !!s.refreshToken,
    };
  } catch (e) {
    storeSnapshot = { error: String(e) };
  }

  // --- localStorage raw key presence (detect desync between store & storage) ---
  let storageSnapshot: Record<string, unknown> = { error: 'not-available' };
  try {
    storageSnapshot = {
      hasMojeebAuthStorage: !!localStorage.getItem('mojeeb-auth-storage'),
      storageKeyCount: localStorage.length,
      i18nextLng: localStorage.getItem('i18nextLng'),
    };
  } catch (e) {
    storageSnapshot = { error: String(e) };
  }

  return {
    scenario: opts.scenario,
    ts: new Date(now).toISOString(),
    request: opts.request
      ? {
          method: opts.request.method?.toUpperCase() ?? 'UNKNOWN',
          url: opts.request.url ?? 'UNKNOWN',
          status: opts.status ?? null,
          baseURL: opts.request.baseURL ?? null,
          withCredentials: opts.request.withCredentials ?? false,
        }
      : null,
    authStore: storeSnapshot,
    tokens: {
      // Access token IS a JWT — decode for expiry diagnostics
      accessTokenPresent: !!access,
      accessTokenLength: access?.length ?? 0,
      accessTokenExp: accessExp,
      accessTokenRemainingMs: accessRemainingMs,
      accessTokenExpired: accessRemainingMs !== null ? accessRemainingMs <= 0 : null,
      accessTokenLooksLikeJwt: !!access && access.split('.').length === 3,
      // Refresh token is OPAQUE — only structural info (length, shape). No expiry
      // visible from the client; server-side DB is source of truth.
      refreshTokenPresent: !!refresh,
      refreshTokenLength: refresh?.length ?? 0,
      refreshTokenLooksOpaque: refreshLooksOpaque,
    },
    storage: storageSnapshot,
    page: {
      pathname: window.location.pathname,
      search: window.location.search,
      visibilityState: document.visibilityState,
      hasFocus: document.hasFocus(),
    },
    browser: {
      online: navigator.onLine,
      userAgent: navigator.userAgent,
      language: navigator.language,
      clockIso: new Date(now).toISOString(),
    },
    timing: {
      refreshDurationMs: opts.refreshDurationMs ?? null,
    },
    ...(opts.extra ?? {}),
  };
};

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

// NOTE: The interceptor no longer force-redirects to /login on auth failures.
// Previous behavior was a UX catastrophe — any 401 (even from a background call
// or a transient server hiccup) would nuke the session and kick the user out of
// whatever they were doing. Now 401s just reject the promise; the router's
// ProtectedRoute guard handles redirecting when there's genuinely no token.

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
        // SCENARIO A: 401 from backend AND no refresh token in local storage.
        // This can happen when:
        //   - User was logged out in another tab and this one still has in-flight requests
        //   - Local storage was cleared (incognito end-of-session, manual clear)
        //   - AES encryption key changed (VITE_TOKEN_ENCRYPTION_KEY rotated)
        //   - Race condition during logout flow (tokens cleared before request aborted)
        //   - User never logged in but a protected endpoint was hit (bug somewhere)
        //
        // We do NOT force-redirect. ProtectedRoute will redirect on next navigation.
        // The caller's request rejects and any toast/onError is left to the component.
        logger.warn(
          '[API Interceptor] [SCENARIO_A] 401 received AND no refresh token in storage — request rejected, NOT forcing redirect',
          buildAuthDiagnostics({
            scenario: 'A_no_refresh_token',
            request: originalRequest,
            status: 401,
          })
        );
        isRefreshing = false;
        return Promise.reject(error);
      }

      logger.debug('[API Interceptor] Refresh token found, calling authService');

      const refreshStart = Date.now();
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
        const refreshDurationMs = Date.now() - refreshStart;

        // SCENARIO B: refresh token request itself failed.
        // Possible causes we want to distinguish in logs:
        //   - Refresh token genuinely expired/revoked (server returned 401/403)
        //   - Backend is down or unreachable (network error / 5xx)
        //   - Request timed out
        //   - Refresh endpoint exists but returned malformed response
        //   - Clock skew (refresh token looks valid locally but server rejects it)
        //
        // We NEVER force-redirect. Caller keeps their page; ProtectedRoute handles
        // nav-time redirect when appropriate.
        const axiosErr = refreshError as AxiosError | undefined;
        const refreshErrorContext = {
          refreshErrorKind: axiosErr?.isAxiosError ? 'AxiosError' : (refreshError instanceof Error ? refreshError.name : typeof refreshError),
          refreshErrorMessage: refreshError instanceof Error ? refreshError.message : String(refreshError),
          refreshHttpStatus: axiosErr?.response?.status ?? null,
          refreshHttpStatusText: axiosErr?.response?.statusText ?? null,
          refreshResponseData: axiosErr?.response?.data ?? null,
          refreshErrorCode: axiosErr?.code ?? null, // e.g. ECONNABORTED for timeout
          refreshWasNetworkError: !!axiosErr && !axiosErr.response,
        };

        logger.error(
          '[API Interceptor] [SCENARIO_B] Token refresh FAILED — rejecting without redirect',
          refreshError instanceof Error ? refreshError : new Error(String(refreshError)),
          buildAuthDiagnostics({
            scenario: 'B_refresh_failed',
            request: originalRequest,
            status: 401,
            refreshDurationMs,
            extra: refreshErrorContext,
          })
        );

        processQueue(refreshError as AxiosError, null);
        // No force redirect. ProtectedRoute handles the redirect on navigation if
        // the session is truly dead. The user keeps their current page so they
        // can decide to refresh / log in manually.
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
    const status = error.response?.status;
    const logDetails = {
      url: originalRequest.url,
      method: originalRequest.method,
      status,
      retryCount: originalRequest._retryCount,
    };

    // 403 Forbidden — centralized permission denied toast (covers all endpoints)
    // Mark as handled so component onError handlers can skip their own toast
    if (status === 403) {
      const apiMessage = error.response?.data?.message;
      toast.error(apiMessage || i18n.t('errors.permission_denied'));
      (error as any)._toastHandled = true;
    }

    // 4xx errors are client-side (expected in many flows like 404 no-subscription)
    // Only log 5xx and network errors as ERROR
    if (status && status >= 400 && status < 500) {
      logger.info('Request failed with client error', logDetails);
    } else {
      logger.error('Request failed after retries', error, logDetails);
    }

    return Promise.reject(error);
  }
);

export default api;
