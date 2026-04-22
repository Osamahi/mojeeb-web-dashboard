/**
 * Per-agent attachments hook for Studio page.
 *
 * Uses useInfiniteQuery with cursor pagination and auto-fetches every page
 * in the background. Callers see the full flattened list as `data`, matching
 * the previous useQuery shape, so no UI changes are required.
 *
 * Backend caps `limit` at 100 per request (AttachmentsController). Agents
 * with more than 100 attachments were silently truncated before this change.
 */

import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { attachmentService } from '../services/attachmentService';
import { queryKeys } from '@/lib/queryKeys';
import type { Attachment } from '../types/attachment.types';

const PAGE_SIZE = 100;

export function useAgentAttachments(agentId: string | undefined) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.agentAttachments(agentId),
    queryFn: ({ pageParam }) =>
      attachmentService.getAttachmentsCursor(
        agentId!,
        PAGE_SIZE,
        pageParam as string | undefined
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    enabled: !!agentId,
    staleTime: 30_000,
    select: (data) => ({
      attachments: data.pages.flatMap((page) => page.attachments),
      hasMore: data.pages[data.pages.length - 1]?.hasMore ?? false,
    }),
  });

  // Auto-fetch remaining pages so the Studio UI always shows the full list
  // without needing a Load More button.
  useEffect(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  // Preserve the previous hook contract: `data` is `Attachment[]`.
  return {
    ...query,
    data: query.data?.attachments as Attachment[] | undefined,
  };
}
