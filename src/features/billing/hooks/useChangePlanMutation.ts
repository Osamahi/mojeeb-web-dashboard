import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingService } from '../services/billingService';
import type { ChangePlanRequest, ChangePlanResult } from '../types/billing.types';
import { queryKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Options for change plan mutation
 */
export interface UseChangePlanMutationOptions
  extends Omit<UseMutationOptions<ChangePlanResult, Error, ChangePlanRequest>, 'mutationFn'> {}

/**
 * Mutation hook for changing subscription plan
 *
 * Supports plan upgrades and downgrades with optional proration.
 * Automatically invalidates subscription and invoice queries on success.
 *
 * @param options - Mutation options
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const mutation = useChangePlanMutation({
 *   onSuccess: () => {
 *     onClose();
 *   },
 * });
 *
 * mutation.mutate({
 *   newPlanId: 'plan-uuid',
 *   prorate: true,
 * });
 * ```
 */
export const useChangePlanMutation = (options?: UseChangePlanMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation<ChangePlanResult, Error, ChangePlanRequest>({
    mutationFn: async (request: ChangePlanRequest) => {
      logger.info('[useChangePlanMutation]', 'Changing plan', request);
      return billingService.changePlan(request);
    },
    onSuccess: (data, variables, context) => {
      logger.info('[useChangePlanMutation]', 'Plan changed successfully', {
        subscriptionId: data.subscriptionId,
        newPlanCode: data.newPlanCode,
        prorationAmount: data.prorationAmount,
      });

      // Invalidate subscription and invoice queries
      queryClient.invalidateQueries({ queryKey: queryKeys.mySubscription() });
      queryClient.invalidateQueries({ queryKey: ['billing', 'invoices'] });

      // Show success message with proration info
      let message = `Successfully changed to ${data.newPlanCode} plan`;
      if (data.prorationAmount && data.prorationAmount !== 0) {
        const amount = Math.abs(data.prorationAmount) / 100;
        const action = data.prorationAmount > 0 ? 'charged' : 'credited';
        message += ` (${action} $${amount.toFixed(2)})`;
      }
      toast.success(message);

      // Call user's onSuccess handler
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      const errorMessage = getErrorMessage(error);
      logger.error('[useChangePlanMutation]', 'Failed to change plan', error);
      toast.error(`Failed to change plan: ${errorMessage}`);

      // Call user's onError handler
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};
