import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import {
  subscribeToConversations,
  unsubscribeChannel,
  type RealtimeEventType,
} from '../services/conversationService';
import type { Conversation } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

  useEffect(() => {
    if (!agentId) return;

    // Handle real-time events by updating React Query cache
    const handleRealtimeEvent = (payload: Conversation[], eventType: RealtimeEventType) => {
      if (!payload || payload.length === 0) return;

      const conversation = payload[0];
      const queryKey = queryKeys.conversations(agentId);

      switch (eventType) {
        case 'INSERT':
          // Add new conversation to the top of the list
          queryClient.setQueryData<Conversation[]>(queryKey, (old = []) => {
            // Prevent duplicates
            if (old.some((c) => c.id === conversation.id)) return old;
            return [conversation, ...old];
          });
          break;

        case 'UPDATE':
          // Update existing conversation
          queryClient.setQueryData<Conversation[]>(queryKey, (old = []) => {
            const index = old.findIndex((c) => c.id === conversation.id);

            if (index === -1) {
              // Not found, add to top
              return [conversation, ...old];
            }

            const oldConv = old[index];

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

            // Create new array with updated conversation
            const newList = [...old];
            newList[index] = updatedConv;

            // Move to top if new message and not already at top
            if (hasNewMessage && index !== 0) {
              newList.splice(index, 1);
              newList.unshift(updatedConv);
            }

            // Sort by last_message_at
            newList.sort((a, b) => {
              const aTime = a.last_message_at || a.created_at;
              const bTime = b.last_message_at || b.created_at;
              return new Date(bTime).getTime() - new Date(aTime).getTime();
            });

            return newList;
          });
          break;

        case 'DELETE':
          // Remove conversation from list
          queryClient.setQueryData<Conversation[]>(queryKey, (old = []) => {
            return old.filter((c) => c.id !== conversation.id);
          });
          break;
      }
    };

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
}
