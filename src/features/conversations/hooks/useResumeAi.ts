import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { resumeAi, type CursorPaginatedConversationsResponse } from '../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';
import { updateConversationInCache } from '../utils/optimisticUpdates';
import type { Conversation } from '../types';

/**
 * Manually resumes the AI on a conversation that's currently in an AI hands-off pause.
 *
 * Clears `ai_handoff_until` server-side and cancels any pending re-engagement follow-up.
 * Optimistically clears the local cached value in BOTH the list cache and the single-
 * conversation cache so the composer banner disappears instantly. Rollback restores
 * both on error.
 */
export function useResumeAi() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: ({ conversationId }: { conversationId: string }) =>
      resumeAi(conversationId),

    onMutate: async ({ conversationId }) => {
      const singleKey = queryKeys.conversation(conversationId);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.conversations(agentId) }),
        queryClient.cancelQueries({ queryKey: singleKey }),
      ]);

      const previousListData = queryClient.getQueriesData<InfiniteData<CursorPaginatedConversationsResponse>>({
        queryKey: queryKeys.conversations(agentId),
      });
      const previousSingle = queryClient.getQueryData<Conversation>(singleKey);

      // Optimistic clear — banner hides instantly in both views.
      updateConversationInCache(queryClient, agentId, conversationId, {
        ai_handoff_until: null,
      });
      if (previousSingle) {
        queryClient.setQueryData<Conversation>(singleKey, {
          ...previousSingle,
          ai_handoff_until: null,
        });
      }

      return { previousListData, previousSingle };
    },

    onError: (_error, { conversationId }, context) => {
      context?.previousListData.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data);
      });
      if (context?.previousSingle !== undefined) {
        queryClient.setQueryData(queryKeys.conversation(conversationId), context.previousSingle);
      }
    },

    onSettled: (_data, _error, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations(agentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
    },
  });
}
