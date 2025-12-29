/**
 * Hook for verifying Stripe checkout session status
 * Used on success page to confirm payment completion
 */

import { useQuery } from '@tanstack/react-query';
import { billingService } from '../services/billingService';

/**
 * Verifies a Stripe checkout session by ID
 *
 * Note: This is optional verification. The webhook should have already
 * processed the checkout and created the subscription. This hook is for
 * additional UX (showing payment details, confirming status, etc.)
 *
 * @param sessionId - Stripe checkout session ID from URL params
 * @param enabled - Whether to run the query (default: true if sessionId exists)
 */
export function useVerifyCheckoutSession(sessionId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['billing', 'verify-session', sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      // TODO: Add backend endpoint for session verification
      // For now, we'll just return the sessionId as confirmation
      // Backend should implement: GET /api/stripe/verify-session/{sessionId}
      // which returns session status, amount, subscription ID, etc.

      return {
        sessionId,
        status: 'complete', // Mock data - replace with actual API call
        verified: true,
      };
    },
    enabled: enabled && sessionId !== null,
    retry: 3, // Retry a few times in case webhook is still processing
    retryDelay: 2000, // Wait 2 seconds between retries
    staleTime: 60000, // Cache for 1 minute
  });
}
