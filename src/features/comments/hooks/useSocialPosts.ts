import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { commentService } from '../services/commentService';

const PAGE_SIZE = 50;

export function useSocialPosts(agentId: string | null) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.socialPosts(agentId),
    queryFn: async ({ pageParam }) => {
      if (!agentId) throw new Error('No agent selected');
      return commentService.getAllPosts(agentId, PAGE_SIZE, pageParam);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000,
  });

  const posts = query.data?.pages.flatMap(page => page.items) ?? [];

  return {
    posts,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
  };
}
