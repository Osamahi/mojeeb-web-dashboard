import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { analyticsService } from '../services/analyticsService';
import {
  TIMESERIES_WINDOWS,
  type AnalyticsMetric,
  type TimeseriesWindow,
} from '../types/analytics.types';

/**
 * Time-series chart data for one metric over a window.
 *
 * The window controls only the time range (how far back). Granularity is
 * decided server-side from window size — single source of truth shared
 * across every analytics endpoint (messages, sentiment, angry, actions,
 * active conversations, new conversations).
 *
 * IMPORTANT: `from` and `to` are computed inside the queryFn (NOT memoized
 * upfront) so every fetch — initial mount, window switch, Realtime
 * invalidation — uses a fresh `now`. Memoizing them would freeze the time
 * window at first compute and cause new messages outside the original
 * `to` boundary to be silently excluded after Realtime invalidation.
 *
 * Realtime invalidation is handled by useAnalyticsRealtime — when a counter
 * row changes for this agent, all timeseries queries for this agent get
 * invalidated and refetch with the latest `now`.
 */
export function useMetricsTimeseries(
  agentId: string | undefined,
  metric: AnalyticsMetric,
  window: TimeseriesWindow
) {
  const config = TIMESERIES_WINDOWS[window];

  return useQuery({
    queryKey: [
      ...queryKeys.analytics(agentId),
      'timeseries',
      metric,
      window,
    ] as const,
    queryFn: () => {
      const now = new Date();
      const from = new Date(now.getTime() - config.fromOffsetMs);
      return analyticsService.getTimeseries(
        agentId!,
        metric,
        from.toISOString(),
        now.toISOString()
      );
    },
    enabled: !!agentId,
    // 60s — Realtime invalidation is the primary freshness source for this
    // dashboard (useAnalyticsRealtime debounce-invalidates on counter UPSERTs).
    // The stale window only kicks in as a safety net for tab refocus / dropped
    // WebSocket. 60s avoids the thundering-herd refetch of 4 timeseries on
    // every focus event when nothing has actually changed.
    staleTime: 60 * 1000,
  });
}
