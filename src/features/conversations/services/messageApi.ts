import api from '@/lib/api';
import type { ChatMessage } from '../types/conversation.types';
import { logger } from '@/lib/logger';

/**
 * Request parameters for fetching messages
 */
export interface GetMessagesParams {
  conversationId: string;
  /** Base64-encoded cursor from the previous page. Omit for the first page. */
  cursor?: string | null;
  /** Page size (default 50, max 100) */
  limit?: number;
}

/**
 * Cursor-paginated response from GET /api/v2/messages.
 * Matches the shared cursor-pagination convention used by all other modules
 * (conversations, leads, actions, etc.).
 */
export interface CursorPaginatedMessagesResponse {
  items: ChatMessage[];
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * Fetches a page of messages for a conversation using cursor-based pagination.
 * Calls GET /api/v2/messages (CQRS Query pattern).
 *
 * The returned items are in ASCENDING chronological order (oldest first).
 * For "load more" on scroll-to-top, pass the `next_cursor` from the previous
 * response — the next page will contain messages strictly older than the cursor,
 * still in ascending order, ready to be prepended to the existing list.
 */
export async function getMessages(
  params: GetMessagesParams
): Promise<CursorPaginatedMessagesResponse> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('conversationId', params.conversationId);

    if (params.cursor) {
      queryParams.append('cursor', params.cursor);
    }
    if (params.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }

    const url = `/api/v2/messages?${queryParams.toString()}`;
    const response = await api.get<CursorPaginatedMessagesResponse>(url);

    // Transform media_attachments → attachments (backend sends snake_case: media_attachments)
    const transformedItems = response.data.items.map((msg: any) => {
      if (msg.media_attachments && !msg.attachments) {
        let attachments = msg.media_attachments;

        // If media_attachments is an array, transform to grouped object structure
        if (Array.isArray(msg.media_attachments)) {
          attachments = {
            images: msg.media_attachments.filter((att: any) => att.type === 'image' || att.type === 'sticker' || att.type === 'video'),
            audio: msg.media_attachments.filter((att: any) => att.type === 'audio'),
            files: msg.media_attachments.filter((att: any) => att.type === 'document'),
          };
        }

        return {
          ...msg,
          attachments,
        };
      }
      return msg;
    });

    return {
      items: transformedItems as ChatMessage[],
      next_cursor: response.data.next_cursor ?? null,
      has_more: response.data.has_more ?? false,
    };
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
