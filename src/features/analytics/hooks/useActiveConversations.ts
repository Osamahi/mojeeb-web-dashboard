import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { analyticsService } from '../services/analyticsService';
import {
  TIMESERIES_WINDOWS,
  type TimeseriesWindow,
} from '../types/analytics.types';

/**
 * Time-series of distinct conversations active per bucket.
 *
 * "Active" = had at least one message land in the bucket. A single
 * conversation messaging across N buckets shows up in all N (deduped per
 * bucket). Granularity is decided server-side and shared with every other
 * timeseries metric on the dashboard.
 *
 * For the tile total (window-level distinct count, not per-bucket), use
 * <c>useActiveConversationsCount</c> instead — summing or maxing this
 * hook's points won't give a correct distinct-window count.
 *
 * Realtime invalidation is handled by useAnalyticsRealtime — when a counter
 * row changes for this agent, this query invalidates and refetches with
 * a fresh `now`.
 */
export function useActiveConversations(
  agentId: string | undefined,
  window: TimeseriesWindow
) {
  const config = TIMESERIES_WINDOWS[window];

  return useQuery({
    queryKey: [
      ...queryKeys.analytics(agentId),
      'active-conversations',
      window,
    ] as const,
    queryFn: () => {
      const now = new Date();
      const from = new Date(now.getTime() - config.fromOffsetMs);
      return analyticsService.getActiveConversations(
        agentId!,
        from.toISOString(),
        now.toISOString()
      );
    },
    enabled: !!agentId,
    // Same staleTime as useMetricsTimeseries — Realtime is the primary
    // freshness source; this is a safety net for tab refocus.
    staleTime: 60 * 1000,
  });
}
