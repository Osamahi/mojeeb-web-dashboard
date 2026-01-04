/**
 * TanStack Query mutation hook for updating Stripe products.
 * Handles API calls, loading states, and query invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { pricingService } from '../services/pricingService';
import type { UpdateStripeProductRequest, StripeEnvironmentMode } from '../types/pricing.types';

interface UpdateProductVariables {
  productId: string;
  updates: UpdateStripeProductRequest;
  mode: StripeEnvironmentMode;
}

export function useUpdateProductMutation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, updates, mode }: UpdateProductVariables) =>
      pricingService.updateProduct(productId, updates, mode),

    onSuccess: (data, variables) => {
      // Invalidate products query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ['stripe-products', variables.mode] });

      // Show success toast
      toast.success(t('pricing.update_product_success', { name: data.name }));
    },

    onError: (error: Error) => {
      // Show error toast
      const errorMessage = error.message || t('pricing.update_product_error');
      toast.error(errorMessage);

      // Log error for debugging
      console.error('Failed to update product:', error);
    },
  });
}
