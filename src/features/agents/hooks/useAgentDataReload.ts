/**
 * useAgentDataReload Hook
 * Provides a callback to invalidate all agent-related React Query caches
 * Called when switching agents to reload all dependent data
 */

import { useQueryClient } from '@tanstack/react-query';

/**
 * Returns a function that invalidates all agent-scoped queries
 * This triggers React Query to refetch data for the newly selected agent
 */
export function useAgentDataReload() {
  const queryClient = useQueryClient();

  const reloadAgentData = async () => {
    // Invalidate all agent-related queries
    // This will cause React Query to refetch data with the new agent context
    await Promise.all([
      // Conversations queries
      queryClient.invalidateQueries({ queryKey: ['conversations'] }),

      // Knowledge bases queries
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] }),

      // Widgets queries
      queryClient.invalidateQueries({ queryKey: ['widgets'] }),

      // Analytics queries
      queryClient.invalidateQueries({ queryKey: ['analytics'] }),
      queryClient.invalidateQueries({ queryKey: ['insights'] }),

      // Agent-specific stats
      queryClient.invalidateQueries({ queryKey: ['agent-stats'] }),

      // Conversation messages (if viewing a conversation)
      queryClient.invalidateQueries({ queryKey: ['messages'] }),

      // Any other agent-scoped data
      queryClient.invalidateQueries({ queryKey: ['agent-data'] }),
    ]);
  };

  return reloadAgentData;
}
