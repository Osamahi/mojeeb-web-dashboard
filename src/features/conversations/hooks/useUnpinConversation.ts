import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { unpinConversation } from '../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';

/**
 * React Query mutation hook for unpinning a conversation.
 * Invalidates conversation queries on success so the list refetches with correct sort order.
 */
export function useUnpinConversation() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: unpinConversation,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations(agentId),
      });
    },

    onError: (error) => {
      console.error('Failed to unpin conversation:', error);
    },
  });
}
