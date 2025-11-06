import { useInfiniteQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import { fetchConversations } from '../services/conversationService';

const PAGE_SIZE = 20;

/**
 * React Query hook for infinite scrolling conversations
 *
 * Features:
 * - Automatic pagination with infinite scroll
 * - Loads 20 conversations per page
 * - Proper loading and error states
 * - Cache invalidation on agent change
 *
 * @example
 * ```tsx
 * function ConversationList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteConversations();
 *
 *   return (
 *     <div>
 *       {data?.pages.map(page =>
 *         page.map(conv => <ConversationCard key={conv.id} conversation={conv} />)
 *       )}
 *       {hasNextPage && <button onClick={() => fetchNextPage()}>Load More</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteConversations() {
  const { agentId } = useAgentContext();

  return useInfiniteQuery({
    queryKey: queryKeys.conversations(agentId),
    queryFn: async ({ pageParam = 0 }) => {
      if (!agentId) {
        throw new Error('No agent selected');
      }
      return fetchConversations({
        agentId,
        offset: pageParam,
        limit: PAGE_SIZE,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      // If last page has fewer items than PAGE_SIZE, we've reached the end
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      // Calculate next offset
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000, // 2 minutes - more frequent than agents
    retry: (failureCount, error: AxiosError) => {
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
