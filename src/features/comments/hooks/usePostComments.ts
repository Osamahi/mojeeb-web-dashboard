import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { commentService } from '../services/commentService';

const PAGE_SIZE = 50;

export function usePostComments(postDbId: string | null) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.postComments(postDbId),
    queryFn: async ({ pageParam }) => {
      if (!postDbId) throw new Error('No post selected');
      return commentService.getPostComments(postDbId, PAGE_SIZE, pageParam);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!postDbId,
    staleTime: 60 * 1000,
  });

  const comments = query.data?.pages.flatMap(page => page.items) ?? [];

  return {
    comments,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
  };
}
