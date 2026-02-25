import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { markConversationAsUnread } from '../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';

/**
 * React Query mutation hook for marking a conversation as unread.
 * Invalidates conversation queries on success so all filtered views refetch.
 */
export function useMarkConversationAsUnread() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: markConversationAsUnread,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations(agentId),
      });
    },

    onError: (error) => {
      console.error('Failed to mark conversation as unread:', error);
    },
  });
}
