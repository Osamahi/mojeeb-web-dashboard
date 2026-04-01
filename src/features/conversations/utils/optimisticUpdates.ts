import type { QueryClient, InfiniteData } from '@tanstack/react-query';
import type { ConversationResponse, CursorPaginatedConversationsResponse } from '../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Optimistically update a conversation inside the infinite query cache.
 * Finds the conversation by ID across all pages and applies the partial update.
 */
export function updateConversationInCache(
  queryClient: QueryClient,
  agentId: string | undefined,
  conversationId: string,
  updates: Partial<ConversationResponse>,
) {
  queryClient.setQueriesData<InfiniteData<CursorPaginatedConversationsResponse>>(
    { queryKey: queryKeys.conversations(agentId) },
    (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          items: page.items.map((conv) =>
            conv.id === conversationId ? { ...conv, ...updates } : conv
          ),
        })),
      };
    },
  );
}
