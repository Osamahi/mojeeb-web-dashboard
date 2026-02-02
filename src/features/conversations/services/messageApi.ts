import api from '@/lib/api';
import type { ChatMessage } from '../types/conversation.types';
import { logger } from '@/lib/logger';

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
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('conversationId', params.conversationId);

    if (params.offset !== undefined) {
      queryParams.append('offset', params.offset.toString());
    }
    if (params.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }

    const url = `/api/v2/messages?${queryParams.toString()}`;
    const response = await api.get<PaginatedMessagesResponse>(url);

    // Transform media_attachments → attachments (backend sends snake_case: media_attachments)
    const transformedItems = response.data.items.map((msg: any) => {
      // If backend sent media_attachments, map it to attachments
      if (msg.media_attachments && !msg.attachments) {
        // Backend sends: [{type: "image", url: "..."}, {type: "audio", url: "..."}]
        // Frontend expects: {images: [{url: "..."}], audio: [{url: "..."}], files: [{url: "..."}]}
        let attachments = msg.media_attachments;

        // If media_attachments is an array, transform to grouped object structure
        if (Array.isArray(msg.media_attachments)) {
          attachments = {
            images: msg.media_attachments.filter((att: any) => att.type === 'image'),
            audio: msg.media_attachments.filter((att: any) => att.type === 'audio'),
            files: msg.media_attachments.filter((att: any) => att.type === 'document'),
          };
        }

        return {
          ...msg,
          attachments: attachments,
        };
      }
      return msg;
    });

    // Replace original items with transformed items
    response.data.items = transformedItems as any;

    return response.data.items;
  } catch (error) {
    logger.error('[messageApi]', 'getMessages() failed', {
      conversationId: params.conversationId,
      error: error instanceof Error ? error.message : String(error),
      // @ts-ignore - axios error structure
      status: error?.response?.status,
    });

    throw error;
  }
}
