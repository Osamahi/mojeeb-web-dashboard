import { useState, useEffect, useRef, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getAccessToken, getRefreshToken } from '@/lib/tokenManager';
import { authService } from '../services/authService';
import { logger } from '@/lib/logger';
import { useOnAppResume } from '@/contexts/AppLifecycleContext';
import { SubscriptionInitializer } from '@/features/subscriptions/components/SubscriptionInitializer';
import { PlanInitializer } from '@/features/subscriptions/components/PlanInitializer';
import { useAnalytics } from '@/lib/analytics';

interface AuthInitializerProps {
  children: ReactNode;
}

/**
 * AuthInitializer - Critical component to prevent authentication flickering
 *
 * On page load/refresh:
 * 1. Validates accessToken exists
 * 2. If missing but refreshToken exists, proactively refreshes token
 * 3. Shows loading state during validation
 * 4. Only renders children after auth state is stable
 *
 * On app resume (mobile browser):
 * 1. Detects when app comes back from background
 * 2. Shows "Reconnecting..." state
 * 3. Validates and refreshes tokens if needed
 * 4. Reconnects to services seamlessly
 *
 * This prevents the flickering loop caused by:
 * - isAuthenticated=true (from Zustand rehydration)
 * - accessToken=null (not persisted for security)
 * - API calls fail → redirect to login
 * - PublicRoute sees isAuthenticated=true → redirects back
 */
export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { identify, reset } = useAnalytics();
  const navigate = useNavigate();
  const location = useLocation();

  // Prevent re-initialization on auth state changes
  const hasInitialized = useRef(false);

  // Maximum retry attempts for network errors
  const MAX_RETRIES = 3;

  // Helper to detect network errors (can retry) vs auth errors (must logout)
  const isNetworkError = (error: any): boolean => {
    const message = error?.message?.toLowerCase() || '';
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch') ||
      message.includes('timeout') ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ETIMEDOUT'
    );
  };

  useEffect(() => {
    // Only run initialization once on mount, ignore subsequent auth state changes
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeAuth = async () => {
      try {
        // CRITICAL: Skip initialization on login/register pages to prevent infinite loops
        // When logout redirects to /login, we don't want to trigger another logout cycle
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
        if (publicPaths.includes(location.pathname)) {
          setIsInitializing(false);
          return;
        }

        // If not authenticated, no need to validate tokens
        if (!isAuthenticated) {
          setIsInitializing(false);
          return;
        }

        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        // Case 1: Has both tokens - all good
        if (accessToken && refreshToken) {
          setIsInitializing(false);
          return;
        }

        // Case 2: Has refresh token but no access token - proactively refresh
        if (!accessToken && refreshToken) {
          logger.info('AuthInitializer', 'Access token missing, attempting refresh...');

          try {
            // Use centralized refresh method that handles token storage and Supabase auth
            await authService.refreshAndUpdateSession(refreshToken);

            logger.info('AuthInitializer', 'Token refresh successful');
            setIsInitializing(false);
            return;
          } catch (error) {
            logger.error('AuthInitializer', 'Token refresh failed', error);

            // Differentiate between network errors and auth errors
            if (isNetworkError(error) && retryCount < MAX_RETRIES) {
              const nextRetryCount = retryCount + 1;
              const retryDelay = Math.pow(2, nextRetryCount) * 1000; // Exponential backoff: 2s, 4s, 8s

              logger.info(`AuthInitializer: Network error, retrying... (${nextRetryCount}/${MAX_RETRIES})`);

              setRetryCount(nextRetryCount);
              setTimeout(() => {
                hasInitialized.current = false; // Reset to allow re-initialization
                initializeAuth();
              }, retryDelay);
              return;
            }

            // Auth error or max retries reached - logout and redirect
            await logout({ reason: 'token-invalid' });
            return;
          }
        }

        // Case 3: No tokens but authenticated - inconsistent state, logout
        if (!accessToken && !refreshToken && isAuthenticated) {
          logger.warn('AuthInitializer', 'Inconsistent auth state - no tokens but isAuthenticated=true');
          await logout({ reason: 'token-invalid' });
          return;
        }

      } catch (error) {
        logger.error('AuthInitializer', 'Unexpected error during initialization', error);

        // Differentiate between network errors and auth errors
        if (isNetworkError(error) && retryCount < MAX_RETRIES) {
          const nextRetryCount = retryCount + 1;
          const retryDelay = Math.pow(2, nextRetryCount) * 1000;

          setRetryCount(nextRetryCount);
          setTimeout(() => {
            hasInitialized.current = false;
            initializeAuth();
          }, retryDelay);
          return;
        }

        // Auth error or max retries - logout (handles redirect internally)
        await logout({ reason: 'session-timeout' });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
    // Run only once on mount, not on auth state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle app resume from background (mobile browser lifecycle)
  // Uses global AppLifecycleProvider instead of per-component listeners
  useOnAppResume(async () => {
    // Only handle reconnection if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    setIsReconnecting(true);

    try {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      // If access token is missing but refresh token exists, refresh proactively
      if (!accessToken && refreshToken) {
        logger.info('AuthInitializer', 'Token refresh on app resume');

        try {
          // Use centralized refresh method that handles token storage and Supabase auth
          await authService.refreshAndUpdateSession(refreshToken);

          logger.info('AuthInitializer', 'Token refresh on app resume successful');
        } catch (error) {
          logger.error('AuthInitializer', 'Token refresh on app resume failed', error);
          // Don't logout immediately - let the user try to interact
          // The API interceptor will handle 401s if tokens are truly invalid
        }
      }
    } catch (error) {
      logger.error('AuthInitializer', 'Error during app resume', error);
    } finally {
      // Clear reconnecting state immediately (no artificial delay needed)
      setIsReconnecting(false);
    }
  });

  // Identify user for analytics when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Identify user with analytics providers (adds userId to all subsequent events)
      identify(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } else {
      // Reset analytics session on logout
      reset();
    }
  }, [isAuthenticated, user, identify, reset]);

  // Show loading spinner during initialization
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          {/* Loading Spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-neutral-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>

          {/* Loading Text */}
          <p className="text-sm text-neutral-600 font-medium">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  // Show reconnecting notification in top-right corner when app resumes (non-blocking)
  if (isReconnecting) {
    return (
      <>
        {children}
        {/* Reconnecting Notification - top-right corner */}
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-neutral-200 px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
            {/* Loading Spinner */}
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 border-2 border-neutral-200 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>

            {/* Reconnecting Text */}
            <p className="text-sm text-neutral-900 font-medium">
              Reconnecting...
            </p>
          </div>
        </div>
      </>
    );
  }

  // Auth initialized, render children
  // Also render SubscriptionInitializer and PlanInitializer to load data once (in parallel)
  return (
    <>
      {isAuthenticated && (
        <>
          <SubscriptionInitializer />
          <PlanInitializer />
        </>
      )}
      {children}
    </>
  );
};
