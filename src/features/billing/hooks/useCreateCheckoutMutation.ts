import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingService } from '../services/billingService';
import type { CreateCheckoutRequest, CheckoutSession } from '../types/billing.types';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';
import { usePlanStore } from '@/features/subscriptions/stores/planStore';

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
  const plans = usePlanStore((state) => state.plans);

  return useMutation<CheckoutSession, Error, CreateCheckoutRequest>({
    mutationFn: async (request: CreateCheckoutRequest) => {
      logger.info('[useCreateCheckoutMutation]', 'Creating checkout session', request);

      // Track checkout initiation - sends to all analytics providers
      const plan = plans.find((p) => p.id === request.planId);
      if (plan) {
        const pricing = plan.pricing[request.currency];
        const price = request.billingInterval === 'monthly' ? pricing?.monthly : pricing?.annual;

        if (price) {
          analytics.track('checkout_initiated', {
            planId: plan.id,
            planName: plan.name,
            planCode: plan.code,
            amount: price,
            currency: request.currency,
            billingInterval: request.billingInterval,
            userId: '', // Will be enriched by AnalyticsService if user is identified
          });
        }
      }

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
