/**
 * TanStack Query mutation hook for creating Stripe prices.
 * Handles API calls, loading states, and query invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { pricingService } from '../services/pricingService';
import type { CreateStripePriceRequest, StripeEnvironmentMode } from '../types/pricing.types';

interface CreatePriceVariables {
  priceData: CreateStripePriceRequest;
  mode: StripeEnvironmentMode;
}

export function useCreatePriceMutation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ priceData, mode }: CreatePriceVariables) =>
      pricingService.createPrice(priceData, mode),

    onSuccess: (data, variables) => {
      // Invalidate products query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ['stripe-products', variables.mode] });

      // Show success toast
      toast.success(
        t('pricing.create_price_success', {
          amount: data.amount / 100,
          currency: data.currency,
          interval: data.interval,
        })
      );
    },

    onError: (error: Error) => {
      // Show error toast
      const errorMessage = error.message || t('pricing.create_price_error');
      toast.error(errorMessage);

      // Log error for debugging
      console.error('Failed to create price:', error);
    },
  });
}
