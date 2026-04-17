import { useState, useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getAccessToken, getRefreshToken } from '@/lib/tokenStore';
import { authService } from '../services/authService';
import { logger } from '@/lib/logger';
import { useOnAppResume } from '@/contexts/AppLifecycleContext';
import { SubscriptionInitializer } from '@/features/subscriptions/components/SubscriptionInitializer';
import { PlanInitializer } from '@/features/subscriptions/components/PlanInitializer';
import { useAnalytics } from '@/lib/analytics';
import { isTokenExpired } from '../utils/tokenUtils';

interface AuthInitializerProps {
  children: ReactNode;
}

/**
 * AuthInitializer — runs inside protected routes. Its job:
 *
 * On mount (once per protected-route entry):
 *   - If we have a refresh token but no access token in memory (common case
 *     after a page reload, since access tokens aren't persisted), refresh now
 *     so that the first API call from a child component already has a Bearer
 *     header. Prevents the "flash of 401 → retry" on first paint.
 *   - If refresh fails, let the axios interceptor handle it when API calls
 *     happen. We don't force a logout here.
 *
 * On app resume (mobile / tab switch):
 *   - If the access token is missing or expired, kick off a refresh so the
 *     user doesn't see a latency hit on their first action.
 */
export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { identify, reset } = useAnalytics();
  const location = useLocation();

  // Don't re-run initialization on auth state changes.
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeAuth = async () => {
      try {
        // Skip on auth pages — they don't need a session and triggering a
        // refresh here creates loops if the refresh token is bad.
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
        if (publicPaths.includes(location.pathname)) {
          return;
        }

        if (!isAuthenticated) {
          return;
        }

        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        // Already have both — nothing to do.
        if (accessToken && refreshToken) {
          return;
        }

        // Have refresh token but no access token — happens on every page reload.
        // Refresh now so first API call from a child doesn't have to wait.
        if (!accessToken && refreshToken) {
          try {
            await authService.refreshAndUpdateSession(refreshToken);
          } catch (error) {
            // Don't force logout on a single failure here — the axios
            // interceptor will re-try on the next real API call, and if the
            // refresh token is truly dead, it will clear the session then.
            logger.warn('[AuthInitializer] Refresh-on-mount failed, deferring to interceptor', error);
          }
          return;
        }

        // Store says authenticated but no refresh token anywhere — corrupted
        // state. Clear it so guards redirect to /login.
        if (!refreshToken && isAuthenticated) {
          useAuthStore.setState({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // App resume handler (mobile browser coming back from background)
  useOnAppResume(async () => {
    if (!isAuthenticated) return;

    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    const needsRefresh =
      (!accessToken && refreshToken) ||
      (accessToken && refreshToken && isTokenExpired(accessToken));

    if (!needsRefresh) return;

    setIsReconnecting(true);
    try {
      await authService.refreshAndUpdateSession(refreshToken!);
    } catch (error) {
      // Don't logout — let the next API call go through the interceptor,
      // which will handle the error properly.
      logger.warn('[AuthInitializer] Refresh on app resume failed', error);
    } finally {
      setIsReconnecting(false);
    }
  });

  // Analytics identify / reset
  useEffect(() => {
    if (isAuthenticated && user) {
      identify(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } else {
      reset();
    }
  }, [isAuthenticated, user, identify, reset]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-neutral-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-neutral-600 font-medium">Initializing...</p>
        </div>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <>
        {children}
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-neutral-200 px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 border-2 border-neutral-200 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-neutral-900 font-medium">Reconnecting...</p>
          </div>
        </div>
      </>
    );
  }

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
