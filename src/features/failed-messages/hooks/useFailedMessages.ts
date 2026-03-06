/**
 * React Query hooks for fetching failed messages
 * Uses infinite scroll with cursor pagination (same pattern as useActions)
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { failedMessageService } from '../services/failedMessageService';
import type { FailedMessageFilters } from '../types';

/**
 * Infinite scroll hook for failed messages (SuperAdmin only)
 */
export function useInfiniteFailedMessages(filters?: FailedMessageFilters) {
  return useInfiniteQuery({
    queryKey: ['failed-messages', 'infinite-cursor', filters],
    queryFn: ({ pageParam }) =>
      failedMessageService.getFailedMessagesCursor(50, pageParam, filters),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    select: (data) => ({
      items: data.pages.flatMap((page) => page.items),
      hasMore: data.pages[data.pages.length - 1]?.hasMore ?? false,
    }),
  });
}
