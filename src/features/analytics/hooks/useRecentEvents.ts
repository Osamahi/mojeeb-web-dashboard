import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { funnelService } from '../services/funnelService';

export function useRecentEvents(startDate: string, endDate: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.funnelRecentEvents(startDate, endDate),
    queryFn: ({ pageParam }) =>
      funnelService.getRecentEvents(startDate, endDate, 50, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    select: (data) => {
      const lastPage = data.pages[data.pages.length - 1];
      return {
        events: data.pages.flatMap((page) => page.events),
        hasMore: lastPage?.hasMore ?? false,
        nextCursor: lastPage?.nextCursor ?? null,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}
