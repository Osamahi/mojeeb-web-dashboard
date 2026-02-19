import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { unpinConversation } from '../services/conversationApi';
import { updateConversationPinStateInCache } from '../utils/cacheUpdates';

/**
 * React Query mutation hook for unpinning a conversation.
 *
 * Features:
 * - Optimistic cache update (instant UI feedback)
 * - Updates in place (server handles reordering on next fetch)
 * - Silent error handling (automatic action)
 */
export function useUnpinConversation() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: unpinConversation,

    onMutate: async (conversationId) => {
      updateConversationPinStateInCache(queryClient, agentId, conversationId, false);
    },

    onError: (error) => {
      console.error('Failed to unpin conversation:', error);
    },
  });
}
