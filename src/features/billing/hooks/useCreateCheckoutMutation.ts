import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingService } from '../services/billingService';
import type { CreateCheckoutRequest, CheckoutSession } from '../types/billing.types';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Options for create checkout mutation
 */
export interface UseCreateCheckoutMutationOptions
  extends Omit<
    UseMutationOptions<CheckoutSession, Error, CreateCheckoutRequest>,
    'mutationFn'
  > {
  /** Auto-redirect to Stripe checkout after session creation */
  autoRedirect?: boolean;
}

/**
 * Mutation hook for creating Stripe checkout session
 *
 * Creates a checkout session and optionally redirects user to Stripe-hosted checkout.
 *
 * @param options - Mutation options with auto-redirect flag
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const mutation = useCreateCheckoutMutation({
 *   autoRedirect: true,
 *   onSuccess: () => {
 *     toast.success('Redirecting to checkout...');
 *   },
 * });
 *
 * mutation.mutate({
 *   planId: 'plan-uuid',
 *   currency: BillingCurrency.USD,
 *   billingInterval: BillingInterval.Monthly,
 * });
 * ```
 */
export const useCreateCheckoutMutation = (options?: UseCreateCheckoutMutationOptions) => {
  const { autoRedirect = true, ...restOptions } = options || {};

  return useMutation<CheckoutSession, Error, CreateCheckoutRequest>({
    mutationFn: async (request: CreateCheckoutRequest) => {
      logger.info('[useCreateCheckoutMutation]', 'Creating checkout session', request);
      return billingService.createCheckoutSession(request);
    },
    onSuccess: (data, variables, context) => {
      logger.info('[useCreateCheckoutMutation]', 'Checkout session created', {
        sessionId: data.sessionId,
      });

      // Auto-redirect to Stripe checkout if enabled
      if (autoRedirect && data.sessionUrl) {
        logger.info('[useCreateCheckoutMutation]', 'Redirecting to Stripe checkout');
        window.location.href = data.sessionUrl;
      }

      // Call user's onSuccess handler
      restOptions.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      const errorMessage = getErrorMessage(error);
      logger.error('[useCreateCheckoutMutation]', 'Failed to create checkout session', error);
      toast.error(`Failed to create checkout: ${errorMessage}`);

      // Call user's onError handler
      restOptions.onError?.(error, variables, context);
    },
    ...restOptions,
  });
};
