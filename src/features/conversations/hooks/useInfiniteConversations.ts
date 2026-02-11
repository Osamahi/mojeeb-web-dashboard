import { useInfiniteQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import { getConversations } from '../services/conversationApi';

const PAGE_SIZE = 50; // Match cursor API page size

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

  const query = useInfiniteQuery({
    queryKey: queryKeys.conversations(agentId),
    queryFn: async ({ pageParam }) => {
      if (!agentId) {
        throw new Error('No agent selected');
      }

      // ✨ CURSOR-BASED PAGINATION (V2 API)
      const response = await getConversations({
        agent_id: agentId,
        limit: PAGE_SIZE,
        cursor: pageParam, // undefined for first page, cursor string for subsequent pages
      });

      // Verification logging
      if (import.meta.env.DEV) {
        console.log('[useInfiniteConversations] Fetched page:', {
          cursor: pageParam || 'FIRST_PAGE',
          itemCount: response.items.length,
          hasMore: response.has_more,
          nextCursor: response.next_cursor,
        });

        // Log duplicate IDs detection
        const ids = response.items.map((c) => c.id);
        const dupes = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (dupes.length > 0) {
          console.warn('[useInfiniteConversations] ⚠️ Duplicate IDs in single page:', dupes);
        }
      }

      return response;
    },
    getNextPageParam: (lastPage) => {
      // Return cursor for next page, or undefined if no more pages
      return lastPage.has_more ? lastPage.next_cursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000, // 2 minutes - more frequent than agents
    refetchOnWindowFocus: true, // Refetch when window regains focus (fixes mobile read state issue)
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

  // Flatten pages into single conversations array
  const conversations = query.data?.pages.flatMap((page) => page.items ?? []) ?? [];

  // Verification: Log duplicate IDs across ALL pages
  if (import.meta.env.DEV && conversations.length > 0) {
    const ids = conversations.map((c) => c.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      const dupes = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.error('[useInfiniteConversations] ❌ DUPLICATE IDs across pages:', {
        totalConversations: ids.length,
        uniqueConversations: uniqueIds.size,
        duplicateIds: [...new Set(dupes)],
      });
    }
  }

  return {
    conversations,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
    isRefetching: query.isRefetching,
  };
}
