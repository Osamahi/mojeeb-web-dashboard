import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { resumeAi, type CursorPaginatedConversationsResponse } from '../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';
import { updateConversationInCache } from '../utils/optimisticUpdates';
import { useConversationStore } from '../stores/conversationStore';

/**
 * Manually resumes the AI on a conversation that's currently in an AI hands-off pause.
 *
 * Clears `ai_handoff_until` server-side and cancels any pending re-engagement follow-up.
 * Optimistically clears the local cached value so the composer banner disappears
 * immediately (without waiting for the server roundtrip + realtime broadcast).
 */
export function useResumeAi() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();
  const patchSelectedConversation = useConversationStore(
    (state) => state.patchSelectedConversation
  );

  return useMutation({
    mutationFn: ({ conversationId }: { conversationId: string }) =>
      resumeAi(conversationId),

    onMutate: async ({ conversationId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations(agentId) });

      const previousData = queryClient.getQueriesData<InfiniteData<CursorPaginatedConversationsResponse>>({
        queryKey: queryKeys.conversations(agentId),
      });

      // Snapshot the open conversation's pause value BEFORE the optimistic clear so we
      // can restore it on error. Read store state directly (not via the hook) — we're
      // inside a callback, not React render.
      const previousHandoffUntil = useConversationStore
        .getState()
        .selectedConversation?.id === conversationId
        ? useConversationStore.getState().selectedConversation?.ai_handoff_until ?? null
        : null;

      // Optimistic clear — banner hides instantly in BOTH the list (via list cache)
      // and the open ChatPanel (via selected-conversation store).
      updateConversationInCache(queryClient, agentId, conversationId, {
        ai_handoff_until: null,
      });
      patchSelectedConversation(conversationId, { ai_handoff_until: null });

      return { previousData, previousHandoffUntil };
    },

    onError: (_error, { conversationId }, context) => {
      context?.previousData.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data);
      });
      // Restore the open conversation's pause value too — the list-cache rollback
      // alone doesn't refresh ChatPanel because it reads from the Zustand snapshot.
      if (context?.previousHandoffUntil) {
        patchSelectedConversation(conversationId, {
          ai_handoff_until: context.previousHandoffUntil,
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations(agentId) });
    },
  });
}
