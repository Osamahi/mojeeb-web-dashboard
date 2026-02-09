import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import { markConversationAsRead } from '../services/conversationApi';

/**
 * React Query mutation hook for marking a conversation as read.
 *
 * This hook automatically invalidates conversation queries to trigger UI updates.
 * It's designed to be called silently without showing toast notifications (automatic action).
 *
 * Features:
 * - Silently marks conversation as read
 * - Invalidates conversations list to update bold text indicators
 * - Invalidates individual conversation query
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

    onSuccess: (_, conversationId) => {
      // Invalidate conversations list to update UI (bold text disappears)
      if (agentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations(agentId),
        });
      }

      // Invalidate individual conversation query (if fetched separately)
      queryClient.invalidateQueries({
        queryKey: ['conversation', conversationId],
      });
    },

    onError: (error) => {
      // Silent failure - log error but don't show toast (automatic action)
      console.error('Failed to mark conversation as read:', error);
    },
  });
}
