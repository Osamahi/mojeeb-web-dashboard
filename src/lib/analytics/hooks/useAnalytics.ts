/**
 * useAnalytics Hook
 * React hook for tracking events in components
 */

import { useCallback } from 'react';
import { analytics } from '../core/AnalyticsService';
import type { AnalyticsEventName, AnalyticsEventPayload } from '../types';

/**
 * Hook for tracking analytics events
 *
 * @example
 * ```tsx
 * const { track, identify, reset } = useAnalytics();
 *
 * // Track event with type safety
 * track('signup_completed', {
 *   userId: '123',
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   signupMethod: 'email',
 * });
 *
 * // Identify user
 * identify('user-123', { email: 'user@example.com' });
 *
 * // Reset on logout
 * reset();
 * ```
 */
export const useAnalytics = () => {
  /**
   * Track an event with type-safe payload
   */
  const track = useCallback(
    <T extends AnalyticsEventName>(
      eventName: T,
      payload: AnalyticsEventPayload<T>
    ) => {
      analytics.track(eventName, payload);
    },
    []
  );

  /**
   * Identify the current user
   */
  const identify = useCallback((userId: string, traits?: Record<string, unknown>) => {
    analytics.identify(userId, traits);
  }, []);

  /**
   * Reset user session (on logout)
   */
  const reset = useCallback(() => {
    analytics.reset();
  }, []);

  return {
    track,
    identify,
    reset,
  };
};
