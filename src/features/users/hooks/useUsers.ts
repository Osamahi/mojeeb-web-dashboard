/**
 * User hooks
 * React Query hooks for the SuperAdmin users page (cursor pagination).
 * Mirrors the pattern in features/leads/hooks/useLeads.ts.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { queryKeys } from '@/lib/queryKeys';
import type { CursorPaginatedUsersResponse, Role } from '../types';

interface UseInfiniteUsersOptions {
  searchTerm?: string;
  role?: Role;
  /** Page size (default 50, backend clamps to [1, 100]). */
  pageSize?: number;
}

/**
 * Cursor-paginated users list with infinite scroll support.
 *
 * Search and role filters are server-side: changing them spawns a fresh
 * cache entry (queryKey includes filters) and starts again from the first page.
 */
export function useInfiniteUsers(options?: UseInfiniteUsersOptions) {
  const { searchTerm, role, pageSize = 50 } = options ?? {};

  return useInfiniteQuery({
    queryKey: queryKeys.usersFiltered({ searchTerm, role }),
    queryFn: ({ pageParam }) =>
      userService.getUsersCursor(pageSize, pageParam, searchTerm, role),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CursorPaginatedUsersResponse) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined,
    select: (data) => {
      const lastPage = data.pages[data.pages.length - 1];
      return {
        users: data.pages.flatMap((page) => page.items),
        hasMore: lastPage?.has_more ?? false,
        nextCursor: lastPage?.next_cursor ?? null,
      };
    },
  });
}
