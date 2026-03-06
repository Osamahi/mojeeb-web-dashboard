/**
 * Unified Realtime Hook for Comments Page
 *
 * Single hook that subscribes to both `social_posts` and `social_comments`
 * tables, filtered by `connection_id` (one channel per comment-enabled connection).
 *
 * Why `connection_id`?
 * - Both tables already have `connection_id` indexed
 * - No schema migration needed (no `agent_id` on these tables)
 * - Precise: only receives events for this agent's connections
 * - Efficient: typically 1–3 connections per agent
 *
 * Pattern: Query invalidation (same as conversations page)
 * - No manual cache manipulation — triggers server refetch
 * - Keeps stats bar, post list, and comment thread all in sync
 *
 * Usage:
 * ```tsx
 * useCommentsPageRealtime({ agentId, connectionIds, selectedPostId });
 * ```
 */

import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { channelRegistry } from '@/lib/supabaseChannelRegistry';

interface UseCommentsPageRealtimeOptions {
  /** Agent ID — used for query key invalidation */
  agentId: string | null;
  /** Comment-enabled connection IDs for this agent */
  connectionIds: string[];
  /** Currently selected post ID (to invalidate its comment thread) */
  selectedPostId: string | null;
}

export function useCommentsPageRealtime({
  agentId,
  connectionIds,
  selectedPostId,
}: UseCommentsPageRealtimeOptions) {
  const queryClient = useQueryClient();

  // Use a ref for selectedPostId so the WebSocket callback always reads the
  // latest value without needing to tear down / rebuild channels on post switch
  const selectedPostIdRef = useRef(selectedPostId);
  selectedPostIdRef.current = selectedPostId;

  // Stabilize connectionIds so the effect doesn't re-run
  // when the array reference changes but contents are identical
  const connectionKey = useMemo(
    () => [...connectionIds].sort().join(','),
    [connectionIds]
  );

  useEffect(() => {
    if (!agentId || !connectionKey) return;

    const ids = connectionKey.split(',').filter(Boolean);
    if (ids.length === 0) return;

    if (import.meta.env.DEV) {
      console.log('[Comments Realtime] Subscribing to', ids.length, 'connection(s)');
    }

    const channels: ReturnType<typeof supabase.channel>[] = [];

    for (const connectionId of ids) {
      const channelName = `comments-page:${connectionId}`;

      const channel = supabase
        .channel(channelName)
        // social_posts changes (new post, updated comment_count, etc.)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'social_posts',
            filter: `connection_id=eq.${connectionId}`,
          },
          (payload) => {
            if (import.meta.env.DEV) {
              console.log('[Comments Realtime] Post event:', payload.eventType);
            }

            queryClient.invalidateQueries({
              queryKey: queryKeys.socialPosts(agentId),
            });

            queryClient.invalidateQueries({
              queryKey: queryKeys.commentStats(agentId),
            });
          }
        )
        // social_comments changes (new comment, AI reply, status change)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'social_comments',
            filter: `connection_id=eq.${connectionId}`,
          },
          (payload) => {
            if (import.meta.env.DEV) {
              console.log('[Comments Realtime] Comment event:', payload.eventType);
            }

            queryClient.invalidateQueries({
              queryKey: queryKeys.commentStats(agentId),
            });

            queryClient.invalidateQueries({
              queryKey: queryKeys.socialPosts(agentId),
            });

            // Refresh comment thread for the currently viewed post
            const currentPostId = selectedPostIdRef.current;
            if (currentPostId) {
              queryClient.invalidateQueries({
                queryKey: queryKeys.postComments(currentPostId),
              });
            }
          }
        )
        .subscribe((status) => {
          if (import.meta.env.DEV) {
            console.log(`[Comments Realtime] Channel ${channelName}:`, status);
          }
          if (status === 'CHANNEL_ERROR') {
            console.error(`[Comments Realtime] Channel error: ${connectionId}`);
          }
        });

      channelRegistry.register(channel, channelName);
      channels.push(channel);
    }

    return () => {
      if (import.meta.env.DEV) {
        console.log('[Comments Realtime] Unsubscribing from', channels.length, 'channel(s)');
      }
      for (const channel of channels) {
        channelRegistry.unregister(channel);
        supabase.removeChannel(channel);
      }
    };
  }, [agentId, connectionKey, queryClient]);
}
