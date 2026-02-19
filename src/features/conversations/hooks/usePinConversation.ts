import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { pinConversation } from '../services/conversationApi';
import { updateConversationPinStateInCache } from '../utils/cacheUpdates';

/**
 * React Query mutation hook for pinning a conversation.
 *
 * Features:
 * - Optimistic cache update (instant UI feedback)
 * - Moves conversation to top of list immediately
 * - Silent error handling (automatic action)
 */
export function usePinConversation() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: pinConversation,

    onMutate: async (conversationId) => {
      updateConversationPinStateInCache(queryClient, agentId, conversationId, true);
    },

    onError: (error) => {
      console.error('Failed to pin conversation:', error);
    },
  });
}
