import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { markConversationAsResolved, type CursorPaginatedConversationsResponse } from '../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';
import { updateConversationInCache } from '../utils/optimisticUpdates';

export function useMarkConversationAsResolved() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: markConversationAsResolved,

    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations(agentId) });

      const previousData = queryClient.getQueriesData<InfiniteData<CursorPaginatedConversationsResponse>>({
        queryKey: queryKeys.conversations(agentId),
      });

      updateConversationInCache(queryClient, agentId, conversationId, {
        urgent: false,
        requires_human_attention: false,
        am_not_sure_how_to_answer: false,
        sentiment: '3',
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
