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

  // Use setQueriesData for partial key matching — updates all filtered views
  queryClient.setQueriesData({ queryKey }, (oldData: any) => {
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

/**
 * Update conversation pin state in React Query cache (optimistic update)
 *
 * When pinning: moves conversation to the front of the first page (pinned appear first).
 * When unpinning: removes from pinned position and re-inserts at correct chronological position.
 *
 * @param queryClient - React Query client instance
 * @param agentId - Current agent ID
 * @param conversationId - Conversation to update
 * @param isPinned - True to pin, false to unpin
 */
export function updateConversationPinStateInCache(
  queryClient: QueryClient,
  agentId: string | undefined,
  conversationId: string,
  isPinned: boolean
): void {
  const queryKey = queryKeys.conversations(agentId);

  // Use setQueriesData for partial key matching — updates all filtered views
  queryClient.setQueriesData({ queryKey }, (oldData: any) => {
    if (!oldData?.pages) return oldData;

    if (isPinned) {
      // Pinning: remove from current position and prepend to first page
      let targetConv: ConversationResponse | undefined;

      const filteredPages = oldData.pages.map((page: any) => ({
        ...page,
        items: page.items.filter((conv: ConversationResponse) => {
          if (conv.id === conversationId) {
            targetConv = { ...conv, is_pinned: true, pinned_at: new Date().toISOString() };
            return false;
          }
          return true;
        }),
      }));

      if (!targetConv) return oldData;

      const [firstPage, ...restPages] = filteredPages;
      return {
        ...oldData,
        pages: [
          { ...firstPage, items: [targetConv, ...firstPage.items] },
          ...restPages,
        ],
      };
    } else {
      // Unpinning: remove from pinned position and re-insert chronologically
      let targetConv: ConversationResponse | undefined;

      // Remove from current position
      const filteredPages = oldData.pages.map((page: any) => ({
        ...page,
        items: page.items.filter((conv: ConversationResponse) => {
          if (conv.id === conversationId) {
            targetConv = { ...conv, is_pinned: false, pinned_at: null };
            return false;
          }
          return true;
        }),
      }));

      if (!targetConv) return oldData;

      // Find the correct chronological position among unpinned conversations
      // Flatten all items, find insertion point by last_message_at
      const targetTime = targetConv.last_message_at
        ? new Date(targetConv.last_message_at).getTime()
        : 0;

      let inserted = false;
      const newPages = filteredPages.map((page: any) => {
        if (inserted) return page;

        const newItems = [];
        for (const conv of page.items) {
          // Insert before the first unpinned conversation that is older
          if (!inserted && !conv.is_pinned) {
            const convTime = conv.last_message_at
              ? new Date(conv.last_message_at).getTime()
              : 0;
            if (targetTime >= convTime) {
              newItems.push(targetConv!);
              inserted = true;
            }
          }
          newItems.push(conv);
        }

        return { ...page, items: newItems };
      });

      // If not inserted yet (e.g., it's the oldest), append to last page
      if (!inserted) {
        const lastPage = newPages[newPages.length - 1];
        lastPage.items = [...lastPage.items, targetConv];
      }

      return { ...oldData, pages: newPages };
    }
  });
}
