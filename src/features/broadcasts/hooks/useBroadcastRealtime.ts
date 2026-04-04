/**
 * Realtime Sync Hook for Broadcasts
 * Subscribes to Supabase realtime changes on broadcast_campaigns and broadcast_recipients
 * and invalidates React Query cache so the UI stays in sync without polling.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BROADCAST_QUERY_KEYS } from './useBroadcasts';

/**
 * Subscribe to realtime updates for the broadcast campaigns list.
 * Invalidates campaign list queries when any campaign for this agent changes.
 */
export function useBroadcastListRealtime(agentId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel(`broadcast_campaigns:${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_campaigns',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: BROADCAST_QUERY_KEYS.campaigns(agentId),
          });
        }
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.log('[Broadcast Realtime] Campaigns subscription:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, queryClient]);
}

/**
 * Subscribe to realtime updates for a specific broadcast campaign detail + its recipients.
 * Invalidates both the campaign detail and recipients queries when changes occur.
 */
export function useBroadcastDetailRealtime(campaignId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`broadcast_detail:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_campaigns',
          filter: `id=eq.${campaignId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: BROADCAST_QUERY_KEYS.campaignDetail(campaignId),
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_recipients',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: BROADCAST_QUERY_KEYS.campaignDetail(campaignId),
          });
          queryClient.invalidateQueries({
            queryKey: BROADCAST_QUERY_KEYS.recipients(campaignId),
          });
        }
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.log('[Broadcast Realtime] Detail subscription:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, queryClient]);
}
