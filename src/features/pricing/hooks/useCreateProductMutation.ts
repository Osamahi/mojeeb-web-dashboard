/**
 * TanStack Query mutation hook for creating Stripe products.
 * Handles API calls, loading states, and query invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { pricingService } from '../services/pricingService';
import type { CreateStripeProductRequest, StripeEnvironmentMode } from '../types/pricing.types';

interface CreateProductVariables {
  product: CreateStripeProductRequest;
  mode: StripeEnvironmentMode;
}

export function useCreateProductMutation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ product, mode }: CreateProductVariables) =>
      pricingService.createProduct(product, mode),

    onSuccess: (data, variables) => {
      // Invalidate products query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ['stripe-products', variables.mode] });

      // Show success toast
      toast.success(t('pricing.create_product_success', { name: data.name }));
    },

    onError: (error: Error) => {
      // Show error toast
      const errorMessage = error.message || t('pricing.create_product_error');
      toast.error(errorMessage);

      // Log error for debugging
      console.error('Failed to create product:', error);
    },
  });
}
