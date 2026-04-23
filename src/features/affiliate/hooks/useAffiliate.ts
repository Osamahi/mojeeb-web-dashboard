/**
 * Affiliate self-service hooks.
 *
 * Mirrors the cursor-pagination conventions used by features/coupons/hooks/useCoupons.ts
 * and features/leads/hooks/useLeads.ts — TanStack `useInfiniteQuery` + `select` to flatten
 * pages into a single list.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { affiliateService } from '../services/affiliateService';

const affiliateKeys = {
  all: ['affiliate'] as const,
  myRedemptions: (filters?: { dateFrom?: string; dateTo?: string; affiliateUserId?: string }) =>
    [...affiliateKeys.all, 'my-redemptions', filters] as const,
};

export function useInfiniteMyRedemptions(
  dateFrom?: string,
  dateTo?: string,
  /** SuperAdmin-only impersonation override. */
  affiliateUserId?: string,
) {
  return useInfiniteQuery({
    queryKey: affiliateKeys.myRedemptions({ dateFrom, dateTo, affiliateUserId }),
    queryFn: ({ pageParam }) =>
      affiliateService.listMyRedemptions(50, pageParam, dateFrom, dateTo, affiliateUserId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
    select: (data) => {
      const last = data.pages[data.pages.length - 1];
      return {
        redemptions: data.pages.flatMap((p) => p.items),
        hasMore: last?.hasMore ?? false,
        nextCursor: last?.nextCursor ?? null,
      };
    },
  });
}
