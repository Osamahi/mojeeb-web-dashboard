import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { analyticsService } from '../services/analyticsService';

/**
 * List of conversations for the given agent that became angry since `sinceHoursAgo`.
 * Default 24h. Capped at 500 rows by the backend.
 *
 * One row per conversation, ever — deduped at the source via the
 * angry_conversations table.
 *
 * IMPORTANT: `since` is computed inside the queryFn (NOT memoized upfront)
 * so every refetch — including Realtime-triggered invalidations — uses the
 * current `now`. Memoizing would freeze the rolling window at first compute,
 * causing the list to silently miss conversations whose first-angry timestamp
 * is more recent than the cached value.
 */
export function useAngryConversations(
  agentId: string | undefined,
  sinceHoursAgo = 24,
  limit = 100
) {
  return useQuery({
    queryKey: [
      ...queryKeys.analytics(agentId),
      'angry-list',
      sinceHoursAgo,
      limit,
    ] as const,
    queryFn: () => {
      const sinceIso = new Date(
        Date.now() - sinceHoursAgo * 60 * 60 * 1000
      ).toISOString();
      return analyticsService.getAngryConversations(agentId!, sinceIso, limit);
    },
    enabled: !!agentId,
    staleTime: 10 * 1000,
  });
}
