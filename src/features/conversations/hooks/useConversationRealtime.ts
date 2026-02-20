/**
 * Realtime Sync Hook for Conversations
 * Subscribes to Supabase realtime changes and updates React Query cache
 * Created: February 2026
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ConversationResponse } from '../services/conversationApi';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

interface UseConversationRealtimeOptions {
  agentId: string;
  limit?: number;
  status?: string;
  searchTerm?: string;
  enabled?: boolean;
}

type ConversationPayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
}>;

// ============================================================================
// Hook
// ============================================================================

/**
 * Subscribe to realtime conversation updates and sync with React Query cache
 *
 * Features:
 * - Smart cache updates (no full refetch)
 * - Handles INSERT, UPDATE, DELETE events
 * - Automatic subscription cleanup
 * - Agent-specific filtering
 *
 * @param options - Realtime subscription options
 *
 * @example
 * ```tsx
 * function ConversationList() {
 *   const { agentId } = useAgentContext();
 *   const [status, setStatus] = useState<string>();
 *   const [searchTerm, setSearchTerm] = useState<string>();
 *
 *   const { conversations } = useInfiniteConversations({
 *     agentId,
 *     limit: 50,
 *     status,
 *     searchTerm
 *   });
 *
 *   // Enable realtime sync with SAME parameters as infinite query
 *   useConversationRealtime({
 *     agentId,
 *     limit: 50,
 *     status,
 *     searchTerm
 *   });
 *
 *   return <div>{conversations.map(conv => <Card {...conv} />)}</div>;
 * }
 * ```
 */
export function useConversationRealtime(options: UseConversationRealtimeOptions) {
  const { agentId, limit, status, searchTerm, enabled = true } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !agentId) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[Realtime] Subscribing to conversations for agent:', agentId);
    }

    // Create channel for conversation updates
    const channel = supabase
      .channel(`conversations:${agentId}`)
      .on<ConversationPayload>(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'conversations',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('[Realtime] Received event:', payload.eventType, payload);
          }

          // Build query key matching useInfiniteConversations structure
          // IMPORTANT: Must match exactly for cache updates to work
          // ✨ FIXED: Aligned with useInfiniteConversations query key format
          const queryKey = ['conversations', agentId] as const;

          // Update cache based on event type
          switch (payload.eventType) {
            case 'INSERT': {
              // New conversation - prepend to first page
              const newConversation = transformToConversationResponse(payload.new);

              queryClient.setQueryData(queryKey, (oldData: any) => {
                if (!oldData?.pages) {
                  return oldData;
                }

                const newPages = [...oldData.pages];
                if (newPages[0]) {
                  // Prepend to first page
                  newPages[0] = {
                    ...newPages[0],
                    items: [newConversation, ...newPages[0].items],
                  };
                }

                return {
                  ...oldData,
                  pages: newPages,
                };
              });

              break;
            }

            case 'UPDATE': {
              // Conversation updated
              const updatedConversation = transformToConversationResponse(payload.new);

              // If conversation was soft-deleted (status=4), remove it from cache instead of updating
              if (updatedConversation.status === 4) {
                if (import.meta.env.DEV) {
                  console.log('[Realtime] UPDATE: Conversation soft-deleted, removing from cache:', updatedConversation.id);
                }

                queryClient.setQueryData(queryKey, (oldData: any) => {
                  if (!oldData?.pages) return oldData;

                  return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                      ...page,
                      items: page.items.filter((conv: ConversationResponse) => conv.id !== updatedConversation.id),
                    })),
                  };
                });
                break;
              }

              queryClient.setQueryData(queryKey, (oldData: any) => {
                if (!oldData?.pages) {
                  if (import.meta.env.DEV) {
                    console.warn('[Realtime] UPDATE: No pages in cache, skipping update');
                  }
                  return oldData;
                }

                // Find the old conversation in cache
                let oldConversation: ConversationResponse | undefined;
                for (const page of oldData.pages) {
                  oldConversation = page.items.find((c: ConversationResponse) => c.id === updatedConversation.id);
                  if (oldConversation) break;
                }

                // Check if ONLY read status changed (not conversation activity)
                // IMPORTANT: Compare timestamps as Date objects, not strings
                // RPC returns "2026-02-08T14:54:11Z" but realtime returns "2026-02-08T14:54:11+00:00"
                const oldTimestamp = oldConversation?.last_message_at ? new Date(oldConversation.last_message_at).getTime() : null;
                const newTimestamp = updatedConversation.last_message_at ? new Date(updatedConversation.last_message_at).getTime() : null;

                const isOnlyMetadataChange =
                  oldConversation &&
                  oldTimestamp === newTimestamp &&
                  oldConversation.last_message === updatedConversation.last_message;
                const isOnlyReadStatusChange = isOnlyMetadataChange;

                // DEBUG: Log comparison details
                if (import.meta.env.DEV) {
                  console.log('[Realtime] UPDATE comparison:', {
                    conversationId: updatedConversation.id,
                    oldExists: !!oldConversation,
                    timestamp_match: oldTimestamp === newTimestamp,
                    last_message_match: oldConversation?.last_message === updatedConversation.last_message,
                    old_last_message_at: oldConversation?.last_message_at,
                    new_last_message_at: updatedConversation.last_message_at,
                    old_timestamp_ms: oldTimestamp,
                    new_timestamp_ms: newTimestamp,
                    old_last_message: oldConversation?.last_message?.substring(0, 30),
                    new_last_message: updatedConversation.last_message?.substring(0, 30),
                    isOnlyReadStatusChange,
                  });
                }

                if (isOnlyReadStatusChange) {
                  // Just update read/pin status in place, don't move conversation
                  if (import.meta.env.DEV) {
                    console.log('[Realtime] UPDATE: Metadata only (read/pin), updating in place:', updatedConversation.id);
                  }

                  return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                      ...page,
                      items: page.items.map((conv: ConversationResponse) =>
                        conv.id === updatedConversation.id
                          ? {
                              ...conv,
                              is_read: updatedConversation.is_read,
                              read_at: updatedConversation.read_at,
                              is_pinned: updatedConversation.is_pinned,
                              pinned_at: updatedConversation.pinned_at,
                            }
                          : conv
                      ),
                    })),
                  };
                }

                // Real activity update - move to top
                if (import.meta.env.DEV) {
                  console.log('[Realtime] UPDATE: Activity change, moving to top:', updatedConversation.id);
                }

                // Step 1: Remove ALL instances of conversation from all pages (handles duplicates)
                let removedCount = 0;
                const filteredPages = oldData.pages.map((page: any) => {
                  const beforeCount = page.items.length;
                  const filtered = page.items.filter((c: ConversationResponse) =>
                    c.id !== updatedConversation.id
                  );
                  removedCount += beforeCount - filtered.length;
                  return { ...page, items: filtered };
                });

                if (import.meta.env.DEV && removedCount > 1) {
                  console.warn('[Realtime] UPDATE: Removed multiple instances:', {
                    conversationId: updatedConversation.id,
                    removedCount,
                  });
                }

                // Step 2: Add to top of first page (most recent conversation)
                const [firstPage, ...restPages] = filteredPages;
                if (!firstPage) {
                  // Edge case: no pages exist, create first page
                  return {
                    ...oldData,
                    pages: [{
                      items: [updatedConversation],
                      has_more: false,
                      next_cursor: undefined,
                    }],
                  };
                }

                const newPages = [
                  { ...firstPage, items: [updatedConversation, ...firstPage.items] },
                  ...restPages,
                ];

                return {
                  ...oldData,
                  pages: newPages,
                };
              });

              break;
            }

            case 'DELETE': {
              // Conversation deleted - remove from cache
              const deletedId = payload.old.id;

              queryClient.setQueryData(queryKey, (oldData: any) => {
                if (!oldData?.pages) {
                  return oldData;
                }

                const newPages = oldData.pages.map((page: any) => ({
                  ...page,
                  items: page.items.filter((conv: ConversationResponse) => conv.id !== deletedId),
                }));

                return {
                  ...oldData,
                  pages: newPages,
                };
              });

              break;
            }
          }
        }
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.log('[Realtime] Subscription status:', status);
        }
      });

    // Cleanup on unmount or agent change
    return () => {
      if (import.meta.env.DEV) {
        console.log('[Realtime] Unsubscribing from conversations');
      }
      supabase.removeChannel(channel);
    };
  }, [agentId, limit, status, searchTerm, enabled, queryClient]);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform Supabase payload to ConversationResponse
 */
function transformToConversationResponse(data: Record<string, any>): ConversationResponse {
  return {
    id: data.id,
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    customer_metadata: data.customer_metadata,
    agent_id: data.agent_id,
    source: data.source,
    status: data.status,
    last_message: data.last_message,
    last_message_at: data.last_message_at,
    is_ai: data.is_ai,
    is_active: data.is_active,
    topic: data.topic,
    sentiment: data.sentiment,
    requires_human_attention: data.requires_human_attention,
    urgent: data.urgent,
    am_not_sure_how_to_answer: data.am_not_sure_how_to_answer,
    created_at: data.created_at,
    updated_at: data.updated_at,
    is_read: data.is_read ?? false,
    read_at: data.read_at ?? null,
    is_pinned: data.is_pinned ?? false,
    pinned_at: data.pinned_at ?? null,
  };
}
