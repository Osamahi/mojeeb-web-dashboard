/**
 * React Query hooks for fetching attachments
 * Uses infinite scroll with cursor pagination
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { attachmentService } from '../services/attachmentService';
import type { AttachmentFilters } from '../types/attachment.types';
import { useAgentContext } from '@/hooks/useAgentContext';

/**
 * Infinite scroll hook for attachments list (specific agent)
 */
export function useInfiniteAttachments(filters?: AttachmentFilters) {
  const { agentId } = useAgentContext();

  return useInfiniteQuery({
    queryKey: ['attachments', agentId, 'infinite-cursor', filters],
    queryFn: ({ pageParam }) =>
      attachmentService.getAttachmentsCursor(agentId!, 50, pageParam, filters),
    enabled: !!agentId,
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
