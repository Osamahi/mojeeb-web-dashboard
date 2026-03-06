/**
 * Failed message service for API communication
 * Handles snake_case (backend) <-> camelCase (frontend) transformation
 */

import api from '@/lib/api';
import type {
  FailedMessage,
  ApiFailedMessageResponse,
  CursorPaginatedFailedMessagesResponse,
  FailedMessageFilters,
} from '../types';

/**
 * Transform snake_case API response to camelCase frontend model
 */
function transformFailedMessage(apiItem: ApiFailedMessageResponse): FailedMessage {
  return {
    id: apiItem.id,
    conversationId: apiItem.conversation_id,
    agentId: apiItem.agent_id,
    organizationId: apiItem.organization_id,
    errorType: apiItem.error_type,
    errorReason: apiItem.error_reason,
    rawResponse: apiItem.raw_response,
    parsingMethod: apiItem.parsing_method,
    platform: apiItem.platform,
    createdAt: apiItem.created_at || new Date().toISOString(),
  };
}

class FailedMessageService {
  /**
   * Get failed messages with cursor pagination (SuperAdmin only)
   */
  async getFailedMessagesCursor(
    limit: number = 50,
    cursor?: string,
    filters?: FailedMessageFilters
  ): Promise<{ items: FailedMessage[]; nextCursor: string | null; hasMore: boolean }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    if (cursor) {
      params.append('cursor', cursor);
    }

    if (filters?.errorType) {
      params.append('errorType', filters.errorType);
    }

    if (filters?.platform) {
      params.append('platform', filters.platform);
    }

    if (filters?.agentId) {
      params.append('agentId', filters.agentId);
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    const url = `/api/failedmessages?${params.toString()}`;
    const { data } = await api.get<{ data: CursorPaginatedFailedMessagesResponse }>(url);

    return {
      items: data.data.items.map(transformFailedMessage),
      nextCursor: data.data.next_cursor,
      hasMore: data.data.has_more,
    };
  }
}

export const failedMessageService = new FailedMessageService();
