import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingService } from '../services/billingService';
import type { CancelSubscriptionRequest, CancelSubscriptionResult } from '../types/billing.types';
import { queryKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Options for cancel subscription mutation
 */
export interface UseCancelSubscriptionMutationOptions
  extends Omit<
    UseMutationOptions<CancelSubscriptionResult, Error, CancelSubscriptionRequest>,
    'mutationFn'
  > {}

/**
 * Mutation hook for canceling subscription
 *
 * Supports immediate cancellation or cancellation at period end.
 * Automatically invalidates subscription and invoice queries on success.
 *
 * @param options - Mutation options
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const mutation = useCancelSubscriptionMutation({
 *   onSuccess: () => {
 *     onClose();
 *   },
 * });
 *
 * mutation.mutate({ cancelAtPeriodEnd: true });
 * ```
 */
export const useCancelSubscriptionMutation = (
  options?: UseCancelSubscriptionMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation<CancelSubscriptionResult, Error, CancelSubscriptionRequest>({
    mutationFn: async (request: CancelSubscriptionRequest) => {
      logger.info('[useCancelSubscriptionMutation]', 'Canceling subscription', request);
      return billingService.cancelSubscription(request);
    },
    onSuccess: (data, variables, context) => {
      logger.info('[useCancelSubscriptionMutation]', 'Subscription canceled', {
        subscriptionId: data.subscriptionId,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      });

      // Invalidate subscription and invoice queries
      queryClient.invalidateQueries({ queryKey: queryKeys.mySubscription() });
      queryClient.invalidateQueries({ queryKey: ['billing', 'invoices'] });

      // Show success message
      if (data.cancelAtPeriodEnd) {
        toast.success(
          `Subscription will be canceled at the end of your billing period on ${new Date(data.currentPeriodEnd!).toLocaleDateString()}`
        );
      } else {
        toast.success('Subscription canceled successfully');
      }

      // Call user's onSuccess handler
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      const errorMessage = getErrorMessage(error);
      logger.error('[useCancelSubscriptionMutation]', 'Failed to cancel subscription', error);
      toast.error(`Failed to cancel subscription: ${errorMessage}`);

      // Call user's onError handler
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};
