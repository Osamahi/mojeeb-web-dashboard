import api from '@/lib/api';
import type { ChatMessage } from '../types/conversation.types';

/**
 * Request parameters for fetching messages
 */
export interface GetMessagesParams {
  conversationId: string;
  offset?: number;
  limit?: number;
}

/**
 * Paginated response from backend
 */
interface PaginatedMessagesResponse {
  items: ChatMessage[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Fetches messages for a conversation with offset-based pagination
 * Calls GET /api/v2/messages endpoint (CQRS Query pattern)
 *
 * @param params - Query parameters including conversationId, offset, and limit
 * @returns Array of ChatMessage objects
 */
export async function getMessages(
  params: GetMessagesParams
): Promise<ChatMessage[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('conversationId', params.conversationId);

  if (params.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  const response = await api.get<PaginatedMessagesResponse>(
    `/api/v2/messages?${queryParams.toString()}`
  );

  return response.data.items;
}
