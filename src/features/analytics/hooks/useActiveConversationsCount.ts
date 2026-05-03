import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { analyticsService } from '../services/analyticsService';
import {
  TIMESERIES_WINDOWS,
  type TimeseriesWindow,
} from '../types/analytics.types';

/**
 * Scalar count of distinct conversations active anywhere in the window.
 *
 * Distinct from <c>useActiveConversations</c> (which is bucketed): this
 * collapses the entire window into a single COUNT(DISTINCT conversation_id),
 * so each conversation contributes exactly once regardless of how many
 * buckets it spans.
 *
 * Used by the Active Conversations tile. The chart still uses the bucketed
 * hook because it needs per-bucket values for the trend line.
 */
export function useActiveConversationsCount(
  agentId: string | undefined,
  window: TimeseriesWindow
) {
  const config = TIMESERIES_WINDOWS[window];

  return useQuery({
    queryKey: [
      ...queryKeys.analytics(agentId),
      'active-conversations-count',
      window,
    ] as const,
    queryFn: () => {
      const now = new Date();
      const from = new Date(now.getTime() - config.fromOffsetMs);
      return analyticsService.getActiveConversationsCount(
        agentId!,
        from.toISOString(),
        now.toISOString()
      );
    },
    enabled: !!agentId,
    staleTime: 60 * 1000,
  });
}
