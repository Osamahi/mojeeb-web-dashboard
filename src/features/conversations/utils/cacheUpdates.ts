import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { ConversationResponse } from '../types';

/**
 * Update conversation read state in React Query cache (optimistic update)
 *
 * This utility handles optimistic cache updates for marking conversations as read/unread.
 * Used by useMarkConversationAsRead and useMarkConversationAsUnread hooks.
 *
 * @param queryClient - React Query client instance
 * @param agentId - Current agent ID
 * @param conversationId - Conversation to update
 * @param isRead - True to mark as read, false to mark as unread
 *
 * @example
 * ```typescript
 * // Mark as read
 * updateConversationReadStateInCache(queryClient, agentId, conversationId, true);
 *
 * // Mark as unread
 * updateConversationReadStateInCache(queryClient, agentId, conversationId, false);
 * ```
 */
export function updateConversationReadStateInCache(
  queryClient: QueryClient,
  agentId: string | undefined,
  conversationId: string,
  isRead: boolean
): void {
  const queryKey = queryKeys.conversations(agentId);

  queryClient.setQueryData(queryKey, (oldData: any) => {
    if (!oldData?.pages) return oldData;

    return {
      ...oldData,
      pages: oldData.pages.map((page: any) => ({
        ...page,
        items: page.items.map((conv: ConversationResponse) =>
          conv.id === conversationId
            ? {
                ...conv,
                is_read: isRead,
                read_at: isRead ? new Date().toISOString() : null,
              }
            : conv
        ),
      })),
    };
  });
}
