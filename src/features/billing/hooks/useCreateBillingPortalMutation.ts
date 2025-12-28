import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingService } from '../services/billingService';
import type { CreateBillingPortalRequest, BillingPortalSession } from '../types/billing.types';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Options for create billing portal mutation
 */
export interface UseCreateBillingPortalMutationOptions
  extends Omit<
    UseMutationOptions<BillingPortalSession, Error, CreateBillingPortalRequest | undefined>,
    'mutationFn'
  > {
  /** Auto-redirect to billing portal after session creation */
  autoRedirect?: boolean;
}

/**
 * Mutation hook for creating Stripe billing portal session
 *
 * Creates a billing portal session and optionally redirects user to Stripe-hosted portal.
 * The billing portal allows users to manage payment methods, view invoices, and cancel subscriptions.
 *
 * @param options - Mutation options with auto-redirect flag
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const mutation = useCreateBillingPortalMutation({
 *   autoRedirect: true,
 * });
 *
 * // Call with no params (uses current URL as return URL)
 * mutation.mutate();
 *
 * // Or specify custom return URL
 * mutation.mutate({ returnUrl: 'https://app.mojeeb.com/billing' });
 * ```
 */
export const useCreateBillingPortalMutation = (
  options?: UseCreateBillingPortalMutationOptions
) => {
  const { autoRedirect = true, ...restOptions } = options || {};

  return useMutation<BillingPortalSession, Error, CreateBillingPortalRequest | undefined>({
    mutationFn: async (request?: CreateBillingPortalRequest) => {
      logger.info('[useCreateBillingPortalMutation]', 'Creating billing portal session', request);
      return billingService.createBillingPortalSession(request);
    },
    onSuccess: (data, variables, context) => {
      logger.info('[useCreateBillingPortalMutation]', 'Billing portal session created');

      // Auto-redirect to billing portal if enabled
      if (autoRedirect && data.sessionUrl) {
        logger.info('[useCreateBillingPortalMutation]', 'Redirecting to billing portal');
        window.location.href = data.sessionUrl;
      }

      // Call user's onSuccess handler
      restOptions.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      const errorMessage = getErrorMessage(error);
      logger.error('[useCreateBillingPortalMutation]', 'Failed to create billing portal session', error);
      toast.error(`Failed to open billing portal: ${errorMessage}`);

      // Call user's onError handler
      restOptions.onError?.(error, variables, context);
    },
    ...restOptions,
  });
};
