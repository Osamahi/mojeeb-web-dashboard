/**
 * React Query hooks for fetching attachments
 * Uses infinite scroll with cursor pagination
 * Fetches ALL attachments across all agents (SuperAdmin page)
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { attachmentService } from '../services/attachmentService';
import type { AttachmentFilters } from '../types/attachment.types';

/**
 * Infinite scroll hook for ALL attachments across all agents (SuperAdmin only)
 */
export function useInfiniteAttachments(filters?: AttachmentFilters) {
  return useInfiniteQuery({
    queryKey: ['attachments', 'all', 'infinite-cursor', filters],
    queryFn: ({ pageParam }) =>
      attachmentService.getAllAttachmentsCursor(50, pageParam, filters),
    staleTime: 30_000,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    select: (data) => ({
      attachments: data.pages.flatMap((page) => page.attachments),
      hasMore: data.pages[data.pages.length - 1]?.hasMore ?? false,
    }),
  });
}
