/**
 * Conversation API Service - V2 Cursor Pagination
 * Clean Architecture with infinite scroll support
 * Created: February 2026
 */

import api from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface ConversationResponse {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_metadata?: Record<string, any>;
  agent_id: string;
  source: string;
  status: number;
  last_message?: string;
  last_message_at?: string;
  is_ai: boolean;
  is_active: boolean;
  topic?: string;
  sentiment?: string;
  requires_human_attention?: boolean;
  urgent?: boolean;
  am_not_sure_how_to_answer?: boolean;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at?: string;
  is_pinned: boolean;
  pinned_at?: string;
}

export interface CursorPaginatedConversationsResponse {
  items: ConversationResponse[];
  next_cursor?: string;
  has_more: boolean;
}

export interface GetConversationsParams {
  agent_id: string;
  limit?: number;
  cursor?: string;
  status?: string;
  search_term?: string;
  source?: string[];
  is_read?: boolean;
  urgent?: boolean;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch conversations with cursor-based pagination (V2 endpoint)
 *
 * @param params - Query parameters
 * @returns Paginated conversations response
 *
 * @example
 * ```ts
 * // First page
 * const page1 = await getConversations({ agent_id: 'abc-123', limit: 50 });
 *
 * // Next page
 * const page2 = await getConversations({
 *   agent_id: 'abc-123',
 *   limit: 50,
 *   cursor: page1.next_cursor
 * });
 *
 * // With filters
 * const filtered = await getConversations({
 *   agent_id: 'abc-123',
 *   status: '1', // Open
 *   search_term: 'customer name'
 * });
 * ```
 */
export async function getConversations(
  params: GetConversationsParams
): Promise<CursorPaginatedConversationsResponse> {
  const queryParams = new URLSearchParams();

  queryParams.append('agentId', params.agent_id);

  if (params.limit) {
    queryParams.append('limit', params.limit.toString());
  }

  if (params.cursor) {
    queryParams.append('cursor', params.cursor);
  }

  if (params.status) {
    queryParams.append('status', params.status);
  }

  if (params.search_term) {
    queryParams.append('searchTerm', params.search_term);
  }

  if (params.source && params.source.length > 0) {
    queryParams.append('source', params.source.join(','));
  }

  if (params.is_read !== undefined) {
    queryParams.append('isRead', params.is_read.toString());
  }

  if (params.urgent !== undefined) {
    queryParams.append('urgent', params.urgent.toString());
  }

  const response = await api.get<CursorPaginatedConversationsResponse>(
    `/api/v2/conversations?${queryParams.toString()}`
  );

  return response.data;
}

/**
 * Fetch a single conversation by ID
 *
 * @param conversationId - Conversation ID
 * @returns Conversation details
 *
 * @example
 * ```ts
 * const conversation = await fetchConversationById('abc-123');
 * ```
 */
export async function fetchConversationById(
  conversationId: string
): Promise<ConversationResponse> {
  const response = await api.get<ConversationResponse>(
    `/api/v2/conversations/${conversationId}`
  );

  return response.data;
}

/**
 * Toggle AI mode for a conversation
 *
 * @param conversationId - Conversation ID
 * @param isAI - True to enable AI mode, false for human mode
 * @returns Updated conversation
 *
 * @example
 * ```ts
 * const updated = await toggleAIMode('abc-123', false); // Switch to human mode
 * ```
 */
export async function toggleAIMode(
  conversationId: string,
  isAI: boolean
): Promise<ConversationResponse> {
  const response = await api.put<ConversationResponse>(
    `/api/v2/conversations/${conversationId}`,
    { is_ai: isAI }
  );

  return response.data;
}

/**
 * Mark a conversation as read
 *
 * @param conversationId - Conversation ID
 * @returns Success message
 *
 * @example
 * ```ts
 * await markConversationAsRead('abc-123');
 * ```
 */
export async function markConversationAsRead(
  conversationId: string
): Promise<void> {
  await api.post(`/api/v2/conversations/${conversationId}/mark-read`);
}

/**
 * Mark a conversation as unread
 *
 * @param conversationId - The conversation ID to mark as unread
 *
 * @example
 * ```ts
 * await markConversationAsUnread('abc-123');
 * ```
 */
export async function markConversationAsUnread(
  conversationId: string
): Promise<void> {
  await api.post(`/api/v2/conversations/${conversationId}/mark-unread`);
}

/**
 * Pin a conversation to the top of the list
 *
 * @param conversationId - The conversation ID to pin
 */
export async function pinConversation(
  conversationId: string
): Promise<void> {
  await api.post(`/api/v2/conversations/${conversationId}/pin`);
}

/**
 * Unpin a conversation from the top of the list
 *
 * @param conversationId - The conversation ID to unpin
 */
export async function unpinConversation(
  conversationId: string
): Promise<void> {
  await api.post(`/api/v2/conversations/${conversationId}/unpin`);
}
