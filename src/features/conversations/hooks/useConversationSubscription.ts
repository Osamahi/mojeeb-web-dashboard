import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useOnAppResume } from '@/contexts/AppLifecycleContext';
import { queryKeys } from '@/lib/queryKeys';
import {
  subscribeToConversations,
  unsubscribeChannel,
  type RealtimeEventType,
} from '../services/conversationService';
import type { Conversation } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Type for React Query Infinite Data structure
type InfiniteData<T> = {
  pages: T[];
  pageParams: unknown[];
};

/**
 * Helper function to move a conversation to the top of the first page
 * Used when a conversation receives a new message
 */
const moveConversationToTop = (
  pages: Conversation[][],
  conversation: Conversation,
  fromPageIndex: number
): Conversation[][] => {
  const updatedPages = [...pages];
  // Remove from current position
  updatedPages[fromPageIndex] = updatedPages[fromPageIndex].filter(
    (c) => c.id !== conversation.id
  );
  // Add to top of first page
  updatedPages[0] = [conversation, ...updatedPages[0]];
  return updatedPages;
};

/**
 * React hook for managing real-time conversation subscriptions.
 *
 * This hook automatically subscribes to conversation updates for the currently selected agent
 * and keeps the React Query cache synchronized with real-time changes from Supabase.
 *
 * Features:
 * - Automatic subscription to agent's conversations
 * - Real-time cache updates (INSERT, UPDATE, DELETE)
 * - Automatic cleanup on unmount or agent change
 * - Optimistic UI updates
 *
 * @returns {void}
 *
 * @example
 * ```tsx
 * function ConversationList() {
 *   const { data: conversations } = useConversations();
 *   useConversationSubscription(); // Handles real-time updates
 *
 *   return (
 *     <div>
 *       {conversations?.map(conv => (
 *         <ConversationCard key={conv.id} conversation={conv} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useConversationSubscription() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handleRealtimeEventRef = useRef<((payload: Conversation[], eventType: RealtimeEventType) => void) | null>(null);

  useEffect(() => {
    if (!agentId) return;

    // Handle real-time events by updating React Query cache (Infinite Query structure)
    const handleRealtimeEvent = (payload: Conversation[], eventType: RealtimeEventType) => {
      if (!payload || payload.length === 0) return;

      const conversation = payload[0];
      const queryKey = queryKeys.conversations(agentId);

      switch (eventType) {
        case 'INSERT':
          // Add new conversation to the top of the first page
          queryClient.setQueryData<InfiniteData<Conversation[]>>(queryKey, (old) => {
            if (!old) return old;

            // Check if conversation already exists in any page
            const exists = old.pages.some((page) =>
              page.some((c) => c.id === conversation.id)
            );
            if (exists) return old;

            // Add to the beginning of the first page
            const updatedPages = [...old.pages];
            updatedPages[0] = [conversation, ...updatedPages[0]];

            return {
              pages: updatedPages,
              pageParams: old.pageParams,
            };
          });
          break;

        case 'UPDATE':
          // Update existing conversation in its page
          queryClient.setQueryData<InfiniteData<Conversation[]>>(queryKey, (old) => {
            if (!old) return old;

            let found = false;
            let foundPageIndex = -1;
            let foundConvIndex = -1;

            // Find the conversation in the pages
            for (let pageIndex = 0; pageIndex < old.pages.length; pageIndex++) {
              const page = old.pages[pageIndex];
              const convIndex = page.findIndex((c) => c.id === conversation.id);
              if (convIndex !== -1) {
                found = true;
                foundPageIndex = pageIndex;
                foundConvIndex = convIndex;
                break;
              }
            }

            if (!found) {
              // Not found, add to top of first page
              const updatedPages = [...old.pages];
              updatedPages[0] = [conversation, ...updatedPages[0]];
              return {
                pages: updatedPages,
                pageParams: old.pageParams,
              };
            }

            const oldConv = old.pages[foundPageIndex][foundConvIndex];

            // Check if there's a new message
            const hasNewMessage =
              conversation.last_message_at &&
              (!oldConv.last_message_at ||
                new Date(conversation.last_message_at) > new Date(oldConv.last_message_at));

            // Preserve customer_metadata from old conversation (real-time often doesn't include it)
            const updatedConv: Conversation = {
              ...conversation,
              customer_metadata: conversation.customer_metadata || oldConv.customer_metadata,
            };

            // Create updated pages
            const updatedPages = old.pages.map((page, pageIndex) => {
              if (pageIndex !== foundPageIndex) return page;

              const newPage = [...page];
              newPage[foundConvIndex] = updatedConv;
              return newPage;
            });

            // If new message and not already at top of first page, move it there
            const finalPages = hasNewMessage && (foundPageIndex !== 0 || foundConvIndex !== 0)
              ? moveConversationToTop(updatedPages, updatedConv, foundPageIndex)
              : updatedPages;

            return {
              pages: finalPages,
              pageParams: old.pageParams,
            };
          });
          break;

        case 'DELETE':
          // Remove conversation from all pages
          queryClient.setQueryData<InfiniteData<Conversation[]>>(queryKey, (old) => {
            if (!old) return old;

            const updatedPages = old.pages.map((page) =>
              page.filter((c) => c.id !== conversation.id)
            );

            return {
              pages: updatedPages,
              pageParams: old.pageParams,
            };
          });
          break;
      }
    };

    // Store handler in ref for app lifecycle reconnection
    handleRealtimeEventRef.current = handleRealtimeEvent;

    // Subscribe to conversations for this agent
    const channel = subscribeToConversations(agentId, handleRealtimeEvent);
    channelRef.current = channel;

    // Cleanup on unmount or agent change
    return () => {
      if (channelRef.current) {
        unsubscribeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [agentId, queryClient]);

  // Handle app resume - reconnect Supabase real-time channels
  // Uses global AppLifecycleProvider instead of per-component listeners
  useOnAppResume(() => {
    if (!agentId || !handleRealtimeEventRef.current) {
      if (import.meta.env.DEV) {
        console.log('[useConversationSubscription] Skipping reconnection - no agentId or handler');
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`[useConversationSubscription] App resumed - reconnecting channels for agent ${agentId}`);
    }

    // Unsubscribe from old channel
    if (channelRef.current) {
      if (import.meta.env.DEV) {
        console.log('[useConversationSubscription] Unsubscribing from old channel');
      }
      unsubscribeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Resubscribe with fresh connection
    if (import.meta.env.DEV) {
      console.log('[useConversationSubscription] Resubscribing to conversations');
    }
    const newChannel = subscribeToConversations(agentId, handleRealtimeEventRef.current);
    channelRef.current = newChannel;
    if (import.meta.env.DEV) {
      console.log('[useConversationSubscription] Channel reconnection complete');
    }
  });
}
