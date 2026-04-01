import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { pinConversation, type CursorPaginatedConversationsResponse } from '../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';
import { updateConversationInCache } from '../utils/optimisticUpdates';

export function usePinConversation() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: pinConversation,

    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations(agentId) });

      const previousData = queryClient.getQueriesData<InfiniteData<CursorPaginatedConversationsResponse>>({
        queryKey: queryKeys.conversations(agentId),
      });

      updateConversationInCache(queryClient, agentId, conversationId, {
        is_pinned: true,
        pinned_at: new Date().toISOString(),
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
