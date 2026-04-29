/**
 * Live-updates wire for the analytics dashboard.
 *
 * Strategy: Realtime subscription tells the dashboard "something changed"
 * (a counter row was UPSERTed, or a new angry conversation landed). It does
 * NOT carry the data we display — those are aggregated server-side. So the
 * payload is ignored; we just invalidate the analytics queries and let
 * React Query re-fetch from the backend.
 *
 * Why this shape:
 *   - The `agent_live_metrics` row that just changed doesn't tell us today's
 *     totals on its own — we need a SUM across the day's buckets.
 *   - Re-fetching the live-summary endpoint is cheap (it's a single Postgres
 *     RPC, ~10ms) and keeps the dashboard's source-of-truth math on the backend.
 *   - Debounced 500ms — bursts of 10 messages in a second invalidate once,
 *     not ten times.
 *
 * Requires migrations 076 (publication) and 077 (REPLICA IDENTITY FULL) to
 * be applied so postgres_changes events actually fire on UPSERT.
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { channelRegistry } from '@/lib/supabaseChannelRegistry';

const DEBOUNCE_MS = 500;

export function useAnalyticsRealtime(agentId: string | undefined) {
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!agentId) {
      return;
    }

    const invalidateAnalyticsDebounced = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.analytics(agentId),
          refetchType: 'active',
        });
      }, DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`analytics-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_live_metrics',
          filter: `agent_id=eq.${agentId}`,
        },
        invalidateAnalyticsDebounced
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_action_metrics',
          filter: `agent_id=eq.${agentId}`,
        },
        invalidateAnalyticsDebounced
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'angry_conversations',
          filter: `agent_id=eq.${agentId}`,
        },
        invalidateAnalyticsDebounced
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Subscription failed — surface so it can be tracked. We do NOT poll
          // as a fallback; analytics is a real-time feature by design.
          console.error(`[useAnalyticsRealtime] subscribe failed: ${status}`);
        }
      });

    channelRegistry.register(channel, `analytics-${agentId}`);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      channelRegistry.unregister(channel);
      supabase.removeChannel(channel);
    };
  }, [agentId, queryClient]);
}
