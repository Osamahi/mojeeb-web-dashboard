import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { markConversationAsUnread } from '../services/conversationApi';
import { updateConversationReadStateInCache } from '../utils/cacheUpdates';

/**
 * React Query mutation hook for marking a conversation as unread.
 *
 * This hook silently marks a conversation as unread with optimistic cache updates.
 * Provides instant UI feedback without waiting for realtime.
 *
 * Features:
 * - Optimistic cache update (instant UI feedback)
 * - Works on mobile where realtime subscription unmounts
 * - No toast notifications (user-initiated action, silent per requirements)
 *
 * @returns {UseMutationResult} React Query mutation result object
 *
 * @example
 * ```tsx
 * function ConversationContextMenu({ conversation }) {
 *   const { mutate: markAsUnread } = useMarkConversationAsUnread();
 *
 *   const handleMarkAsUnread = () => {
 *     markAsUnread(conversation.id);
 *   };
 *
 *   return (
 *     <button onClick={handleMarkAsUnread}>
 *       Mark as Unread
 *     </button>
 *   );
 * }
 * ```
 */
export function useMarkConversationAsUnread() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: markConversationAsUnread,

    // Optimistically update cache immediately
    onMutate: async (conversationId) => {
      updateConversationReadStateInCache(queryClient, agentId, conversationId, false);
    },

    onError: (error) => {
      // Silent failure - log error but don't show toast (user-initiated action)
      console.error('Failed to mark conversation as unread:', error);
    },
  });
}
