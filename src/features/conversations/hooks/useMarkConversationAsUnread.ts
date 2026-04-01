import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { markConversationAsUnread, type CursorPaginatedConversationsResponse } from '../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';
import { updateConversationInCache } from '../utils/optimisticUpdates';

export function useMarkConversationAsUnread() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: markConversationAsUnread,

    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations(agentId) });

      const previousData = queryClient.getQueriesData<InfiniteData<CursorPaginatedConversationsResponse>>({
        queryKey: queryKeys.conversations(agentId),
      });

      updateConversationInCache(queryClient, agentId, conversationId, {
        is_read: false,
        read_at: undefined,
      });

      return { previousData };
    },

    onError: (_error, _conversationId, context) => {
      context?.previousData.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations(agentId) });
    },
  });
}
