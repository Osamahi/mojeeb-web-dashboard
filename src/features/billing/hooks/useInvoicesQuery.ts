import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { billingService } from '../services/billingService';
import type { InvoiceList, GetInvoicesParams } from '../types/billing.types';
import { getErrorMessage } from '@/lib/errors';

/**
 * Query hook for fetching invoice history
 *
 * Supports cursor-based pagination via `startingAfter` parameter.
 *
 * @param params - Query parameters (limit, startingAfter)
 * @param options - React Query options
 * @returns Query result with invoice list
 */
export const useInvoicesQuery = (
  params?: GetInvoicesParams,
  options?: Omit<UseQueryOptions<InvoiceList, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<InvoiceList, Error>({
    queryKey: queryKeys.invoices(params?.limit),
    queryFn: () => billingService.getInvoices(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
