import { useQuery } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import { fetchConversations } from '../services/conversationService';

/**
 * React Query hook for fetching conversations for the currently selected agent.
 *
 * This hook automatically refetches conversations when the global agent selection changes,
 * eliminating the need for manual useEffect hooks watching agentId.
 *
 * Features:
 * - Automatic refetch when agent changes (via query key reactivity)
 * - Proper loading and error states
 * - Built-in caching (30-second stale time)
 * - Only fetches when an agent is selected
 *
 * @returns {UseQueryResult} React Query result object with conversations data
 *
 * @example
 * ```tsx
 * function ConversationsPage() {
 *   const { data: conversations, isLoading, error } = useConversations();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <div>
 *       {conversations?.map(conv => (
 *         <ConversationCard key={conv.id} conversation={conv} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useConversations() {
  const { agentId } = useAgentContext();

  return useQuery({
    queryKey: queryKeys.conversations(agentId),
    queryFn: async () => {
      if (!agentId) {
        throw new Error('No agent selected');
      }
      return fetchConversations({ agentId });
    },
    enabled: !!agentId,
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors (401, 403)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      // Don't retry on rate limiting
      if (error?.response?.status === 429) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
}
