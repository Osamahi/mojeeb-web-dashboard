import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { markConversationAsRead } from '../services/conversationApi';
import { updateConversationReadStateInCache } from '../utils/cacheUpdates';

/**
 * React Query mutation hook for marking a conversation as read.
 *
 * This hook silently marks a conversation as read with optimistic cache updates.
 * On mobile, this ensures the UI updates immediately without waiting for realtime.
 *
 * Features:
 * - Optimistic cache update (instant UI feedback)
 * - Works on mobile where realtime subscription unmounts
 * - No toast notifications (automatic action, not user-initiated)
 *
 * @returns {UseMutationResult} React Query mutation result object
 *
 * @example
 * ```tsx
 * function ConversationViewDrawer({ conversationId, isOpen }) {
 *   const { mutate: markAsRead } = useMarkConversationAsRead();
 *   const { data: conversation } = useConversationById(conversationId);
 *
 *   // Smart logic: Mark as read when drawer opens OR when becomes unread while open
 *   useEffect(() => {
 *     if (isOpen && conversation && !conversation.is_read) {
 *       markAsRead(conversation.id);
 *     }
 *   }, [isOpen, conversation?.id, conversation?.is_read, markAsRead]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: markConversationAsRead,

    // Optimistically update cache immediately (fixes mobile issue where realtime unsubscribes)
    onMutate: async (conversationId) => {
      updateConversationReadStateInCache(queryClient, agentId, conversationId, true);
    },

    onError: (error) => {
      // Silent failure - log error but don't show toast (automatic action)
      console.error('Failed to mark conversation as read:', error);
    },
  });
}
