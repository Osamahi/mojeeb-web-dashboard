/**
 * Realtime Sync Hook for Conversations
 * Subscribes to Supabase realtime changes and invalidates React Query cache
 * so the list refetches fresh data from the server.
 * Created: February 2026
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';

interface UseConversationRealtimeOptions {
  agentId: string;
  limit?: number;
  searchTerm?: string;
  enabled?: boolean;
}

/**
 * Subscribe to realtime conversation updates and invalidate queries.
 * No manual cache manipulation — just triggers a refetch from the server
 * so all filtered views stay consistent.
 */
export function useConversationRealtime(options: UseConversationRealtimeOptions) {
  const { agentId, enabled = true } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !agentId) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[Realtime] Subscribing to conversations for agent:', agentId);
    }

    const channel = supabase
      .channel(`conversations:${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('[Realtime] Received event:', payload.eventType);
          }

          // Invalidate all conversation queries for this agent
          // This triggers a refetch, keeping all filtered views in sync with the DB
          queryClient.invalidateQueries({
            queryKey: queryKeys.conversations(agentId),
          });
        }
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.log('[Realtime] Subscription status:', status);
        }
      });

    return () => {
      if (import.meta.env.DEV) {
        console.log('[Realtime] Unsubscribing from conversations');
      }
      supabase.removeChannel(channel);
    };
  }, [agentId, enabled, queryClient]);
}
