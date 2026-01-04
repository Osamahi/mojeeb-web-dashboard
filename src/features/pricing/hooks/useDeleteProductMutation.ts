/**
 * TanStack Query mutation hook for archiving Stripe products.
 * Note: Stripe doesn't allow permanent deletion - this archives the product.
 * Handles API calls, loading states, and query invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { pricingService } from '../services/pricingService';
import type { StripeEnvironmentMode } from '../types/pricing.types';

interface DeleteProductVariables {
  productId: string;
  mode: StripeEnvironmentMode;
}

export function useDeleteProductMutation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, mode }: DeleteProductVariables) =>
      pricingService.deleteProduct(productId, mode),

    onSuccess: (_data, variables) => {
      // Invalidate products query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ['stripe-products', variables.mode] });

      // Show success toast
      toast.success(t('pricing.delete_product_success'));
    },

    onError: (error: Error) => {
      // Show error toast
      const errorMessage = error.message || t('pricing.delete_product_error');
      toast.error(errorMessage);

      // Log error for debugging
      console.error('Failed to archive product:', error);
    },
  });
}
