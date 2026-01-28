/**
 * Post-Authentication Navigation Hook
 * Unified logic for navigation after successful authentication (email login, email signup, Google OAuth, Apple)
 *
 * Responsibilities:
 * - Orchestrate post-auth flow
 * - Call authService.completeAuthFlow()
 * - Handle navigation based on result
 * - Manage loading/error states
 * - Cleanup on component unmount (prevent setState warnings)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { authService } from '../services/authService';
import type { PostAuthNavigationResult } from '../types/auth.types';

export interface UsePostAuthNavigationReturn {
  navigateAfterAuth: (userEmail: string) => Promise<void>;
  isNavigating: boolean;
  navigationError: string | null;
}

/**
 * Custom hook for unified post-authentication navigation
 *
 * Features:
 * - Unified business logic via authService.completeAuthFlow()
 * - AbortSignal integration for canceling in-flight operations
 * - Component unmount protection (prevents setState warnings)
 * - Memoized callback to prevent downstream re-renders
 *
 * Usage:
 * ```typescript
 * const { navigateAfterAuth, isNavigating } = usePostAuthNavigation();
 *
 * // After successful auth
 * await navigateAfterAuth(authResponse.user.email);
 * ```
 */
export function usePostAuthNavigation(): UsePostAuthNavigationReturn {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  // Track if component is still mounted (prevents setState on unmounted component)
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoize navigateAfterAuth to prevent recreating on every render
  // This prevents downstream effects (e.g., GoogleCallbackPage) from re-running unnecessarily
  const navigateAfterAuth = useCallback(
    async (userEmail: string): Promise<void> => {
      // Create AbortController for this navigation attempt
      const abortController = new AbortController();

      if (isMountedRef.current) {
        setIsNavigating(true);
        setNavigationError(null);
      }

      try {
        logger.info('Starting post-auth flow', {
          component: 'usePostAuthNavigation',
          userEmail,
        });

        // Call unified business logic (agents + invitations) with abort support
        const result = await authService.completeAuthFlow(userEmail, abortController.signal);

        logger.info('Post-auth flow completed, navigating', {
          component: 'usePostAuthNavigation',
          userEmail,
          destination: result.destination,
          reason: result.reason,
        });

        // CRITICAL: Navigate even if component unmounted
        // React Router's navigate() is safe to call after unmount
        // Only setState operations should be guarded by isMountedRef
        navigate(result.destination, { replace: true });
      } catch (error) {
        // Only update state if component still mounted
        if (!isMountedRef.current) {
          logger.info('Error occurred but component unmounted, skipping error handling', {
            component: 'usePostAuthNavigation',
          });
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Navigation failed';
        logger.error('Post-auth navigation error', error instanceof Error ? error : new Error(String(error)), {
          component: 'usePostAuthNavigation',
          userEmail,
        });
        setNavigationError(errorMessage);

        // Fallback to conversations on error
        logger.info('Falling back to /conversations due to error', {
          component: 'usePostAuthNavigation',
        });
        navigate('/conversations', { replace: true });
      } finally {
        // Abort any pending async operations
        abortController.abort();

        // Only update state if component still mounted
        if (isMountedRef.current) {
          setIsNavigating(false);
        }
      }
    },
    [navigate] // Only recreate if navigate function changes
  );

  return {
    navigateAfterAuth,
    isNavigating,
    navigationError,
  };
}
