import { useInfiniteQuery } from '@tanstack/react-query';
import { adminConnectionService, type AdminConnectionCursorFilters } from '../services/adminConnectionService';

/**
 * Infinite scroll hook for admin connections with cursor-based pagination.
 * Follows same pattern as useInfiniteAllActions.
 */
export function useInfiniteAdminConnections(filters?: AdminConnectionCursorFilters) {
  return useInfiniteQuery({
    queryKey: ['admin-connections', 'infinite-cursor', filters],
    queryFn: ({ pageParam }) =>
      adminConnectionService.getAllConnectionsCursor(50, pageParam, filters),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    select: (data) => ({
      connections: data.pages.flatMap((page) => page.connections),
      hasMore: data.pages[data.pages.length - 1]?.hasMore ?? false,
    }),
  });
}
