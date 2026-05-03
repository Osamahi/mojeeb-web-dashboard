import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { analyticsService } from '../services/analyticsService';
import {
  TIMESERIES_WINDOWS,
  type TimeseriesWindow,
} from '../types/analytics.types';

/**
 * Time-series of conversations born per bucket.
 *
 * "New" = conversations.created_at falls in the bucket. Each conversation
 * appears in exactly one bucket (its birth moment). Granularity is decided
 * server-side and shared with every other timeseries metric.
 *
 * Response envelope (migration 088): { total, points }. Tile consumers read
 * `data.total` (window-level COUNT(*)); chart consumers read `data.points`.
 * Because each conversation is born in exactly one bucket, the total equals
 * the sum of bucket counts — but the SQL-computed total is canonical and
 * frontend never sums.
 *
 * Realtime invalidation is handled by useAnalyticsRealtime.
 */
export function useNewConversations(
  agentId: string | undefined,
  window: TimeseriesWindow
) {
  const config = TIMESERIES_WINDOWS[window];

  return useQuery({
    queryKey: [
      ...queryKeys.analytics(agentId),
      'new-conversations',
      window,
    ] as const,
    queryFn: () => {
      const now = new Date();
      const from = new Date(now.getTime() - config.fromOffsetMs);
      return analyticsService.getNewConversations(
        agentId!,
        from.toISOString(),
        now.toISOString()
      );
    },
    enabled: !!agentId,
    staleTime: 60 * 1000,
  });
}
