import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from './tokenManager';

// Re-export token management functions for backward compatibility
export { setTokens, getAccessToken, getRefreshToken, clearTokens };

// Export API_URL for use in other modules (e.g., AuthInitializer)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

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
    console.warn('Redirect loop detected - skipping redirect to login');
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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

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

    return Promise.reject(error);
  }
);

export default api;
