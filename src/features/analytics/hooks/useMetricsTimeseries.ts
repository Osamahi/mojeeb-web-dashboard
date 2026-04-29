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
 * The window controls both the time range (how far back) and the default
 * granularity (1m for the 1h view, 5m for 24h, 1h for 7d, 1d for 30d).
 * Granularity can be overridden per-call but the defaults match what
 * makes the chart readable.
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
  window: TimeseriesWindow,
  granularityOverrideMinutes?: number
) {
  const config = TIMESERIES_WINDOWS[window];
  const granularityMinutes =
    granularityOverrideMinutes ?? config.defaultGranularityMinutes;

  return useQuery({
    queryKey: [
      ...queryKeys.analytics(agentId),
      'timeseries',
      metric,
      window,
      granularityMinutes,
    ] as const,
    queryFn: () => {
      const now = new Date();
      const from = new Date(now.getTime() - config.fromOffsetMs);
      return analyticsService.getTimeseries(
        agentId!,
        metric,
        from.toISOString(),
        now.toISOString(),
        granularityMinutes
      );
    },
    enabled: !!agentId,
    staleTime: 10 * 1000,
  });
}
