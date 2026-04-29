import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { analyticsService } from '../services/analyticsService';

/**
 * Today's hero numbers for one agent.
 *
 * The Realtime hook (useAnalyticsRealtime) invalidates this query on every
 * counter row change in the database, so the UI updates live without polling.
 * Stale time is short — we still want a refetch on focus / window-back as a
 * safety net in case the WebSocket dropped silently.
 */
export function useLiveSummary(agentId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.analytics(agentId), 'live-summary'] as const,
    queryFn: () => analyticsService.getLiveSummary(agentId!),
    enabled: !!agentId,
    staleTime: 10 * 1000,
  });
}
