import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { pinConversation } from '../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';

/**
 * React Query mutation hook for pinning a conversation.
 * Invalidates conversation queries on success so the list refetches with correct sort order.
 */
export function usePinConversation() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: pinConversation,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations(agentId),
      });
    },

    onError: (error) => {
      console.error('Failed to pin conversation:', error);
    },
  });
}
