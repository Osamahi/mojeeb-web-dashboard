/**
 * Realtime Sync Hook for Conversations
 *
 * Subscribes to Supabase realtime conversation changes and invalidates the React
 * Query caches that hold conversation data — the list cache (used by
 * ConversationList) and the single-conversation cache (used by ChatPanel via
 * useSelectedConversation). Both views render off the same source, so one
 * invalidation pair keeps every consumer fresh.
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

          // Invalidate the list (any filter variant) so ConversationList refetches.
          queryClient.invalidateQueries({
            queryKey: queryKeys.conversations(agentId),
          });

          // Invalidate the single-conversation cache for the updated row so
          // ChatPanel (via useSelectedConversation) refetches without needing a
          // Zustand mirror. payload.new carries the row id for UPDATE/INSERT;
          // payload.old carries it for DELETE.
          const rowId =
            (payload.new as { id?: string } | null)?.id ??
            (payload.old as { id?: string } | null)?.id;
          if (rowId) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.conversation(rowId),
            });
          }
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
