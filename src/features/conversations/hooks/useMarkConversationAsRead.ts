import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { markConversationAsRead } from '../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';

/**
 * React Query mutation hook for marking a conversation as read.
 * Invalidates conversation queries on success so all filtered views refetch.
 */
export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: markConversationAsRead,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations(agentId),
      });
    },

    onError: (error) => {
      console.error('Failed to mark conversation as read:', error);
    },
  });
}
