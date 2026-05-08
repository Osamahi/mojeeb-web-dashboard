import { useState, useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authSession } from '@/lib/authSession';
import { TerminalAuthError } from '@/features/auth/errors';
import { logger } from '@/lib/logger';
import { useOnAppResume } from '@/contexts/AppLifecycleContext';
import { SubscriptionInitializer } from '@/features/subscriptions/components/SubscriptionInitializer';
import { PlanInitializer } from '@/features/subscriptions/components/PlanInitializer';
import { useAnalytics } from '@/lib/analytics';

interface AuthInitializerProps {
  children: ReactNode;
}

const PUBLIC_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

/**
 * AuthInitializer — gate for protected routes.
 *
 * Two responsibilities:
 *
 * 1. On mount of a protected route, ensure we have a valid access token. The
 *    access token isn't persisted (memory only) so it's missing on every page
 *    load. We call authSession.ensureFresh() to populate it before child
 *    components fire their first API call (avoids a flash of 401 → retry).
 *
 * 2. On real app resume (≥30s of background, gated by AppLifecycleContext),
 *    re-validate the session. Same path, different trigger.
 *
 * Error handling:
 *   - TerminalAuthError → refresh token is dead. Sign the user out via the
 *     centralized logout service. Route guards redirect to /login.
 *   - Anything else (TransientAuthError, network blip, etc.) → log and move
 *     on. The next protected API call will go through the axios interceptor,
 *     which will retry the refresh. We don't blow up the user's session
 *     because of a one-time network hiccup.
 */
export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { identify, reset } = useAnalytics();
  const location = useLocation();

  // useEffect runs twice in React StrictMode dev — guard with a ref.
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Public auth pages don't need a session.
    if (PUBLIC_PATHS.has(location.pathname) || !isAuthenticated) {
      setIsInitializing(false);
      return;
    }

    void authSession
      .ensureFresh()
      .catch((err) => handleSessionError(err, 'mount'))
      .finally(() => setIsInitializing(false));
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useOnAppResume(async () => {
    if (!isAuthenticated) return;
    setIsReconnecting(true);
    try {
      await authSession.ensureFresh();
    } catch (err) {
      await handleSessionError(err, 'resume');
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

async function handleSessionError(err: unknown, source: 'mount' | 'resume') {
  if (err instanceof TerminalAuthError) {
    logger.info(`[AuthInitializer] Terminal auth error on ${source} — signing out`, {
      reason: err.reason,
    });
    try {
      const { performLogout } = await import('../services/logoutService');
      await performLogout({
        callBackend: false,
        redirect: false, // route guards handle the redirect
        reason: 'token-invalid',
      });
    } catch (logoutErr) {
      logger.error(
        `[AuthInitializer] performLogout failed during terminal auth handling`,
        logoutErr instanceof Error ? logoutErr : new Error(String(logoutErr)),
      );
    }
    return;
  }
  // Transient — keep session, next API call will retry via interceptor.
  logger.warn(`[AuthInitializer] Transient refresh failure on ${source}`, err);
}
