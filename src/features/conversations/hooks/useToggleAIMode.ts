import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { toggleAIMode } from '../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';

/**
 * React Query mutation hook for toggling AI mode on a conversation.
 * Invalidates conversation queries on success so all filtered views refetch.
 */
export function useToggleAIMode() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: ({ conversationId, isAI }: { conversationId: string; isAI: boolean }) =>
      toggleAIMode(conversationId, isAI),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations(agentId),
      });
    },

    onError: (error) => {
      console.error('Failed to toggle AI mode:', error);
    },
  });
}
