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
  const startTime = Date.now();

  // Log API request entry
  logger.info('[messageApi]', 'getMessages() called', {
    conversationId: params.conversationId,
    offset: params.offset ?? 0,
    limit: params.limit ?? 50,
  });

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

    // Log before API call
    logger.debug('[messageApi]', 'Sending HTTP GET request', { url });

    const response = await api.get<PaginatedMessagesResponse>(url);

    // Transform media_attachments → attachments (backend sends snake_case: media_attachments)
    const transformedItems = response.data.items.map((msg: any) => {
      // If backend sent media_attachments, map it to attachments
      if (msg.media_attachments && !msg.attachments) {
        logger.debug('[messageApi]', 'Transforming media_attachments → attachments', {
          messageId: msg.id,
          hasMediaAttachments: !!msg.media_attachments,
        });

        // Backend sends: [{type: "image", url: "..."}, {type: "audio", url: "..."}]
        // Frontend expects: {images: [{url: "..."}], audio: [{url: "..."}], files: [{url: "..."}]}
        let attachments = msg.media_attachments;

        // If media_attachments is an array, transform to grouped object structure
        if (Array.isArray(msg.media_attachments)) {
          logger.debug('[messageApi]', 'Converting array format to grouped object format', {
            messageId: msg.id,
            arrayLength: msg.media_attachments.length,
          });

          attachments = {
            images: msg.media_attachments.filter((att: any) => att.type === 'image'),
            audio: msg.media_attachments.filter((att: any) => att.type === 'audio'),
            files: msg.media_attachments.filter((att: any) => att.type === 'document'),
          };

          logger.debug('[messageApi]', 'Grouped attachments by type', {
            messageId: msg.id,
            imageCount: attachments.images.length,
            audioCount: attachments.audio.length,
            fileCount: attachments.files.length,
          });
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

    const duration = Date.now() - startTime;

    // Log response received
    logger.info('[messageApi]', 'API response received', {
      conversationId: params.conversationId,
      itemCount: response.data.items.length,
      hasMore: response.data.hasMore,
      total: response.data.total,
      duration: `${duration}ms`,
    });

    // Log message IDs for debugging (first 3 and last 3)
    if (response.data.items.length > 0) {
      const messageIds = response.data.items.map(m => m.id);
      const sample = messageIds.length <= 6
        ? messageIds
        : [...messageIds.slice(0, 3), '...', ...messageIds.slice(-3)];

      logger.debug('[messageApi]', 'Message IDs in response', {
        conversationId: params.conversationId,
        messageIds: sample,
      });

      // Log multimedia messages with full details
      const multimediaMessages = response.data.items.filter(m =>
        m.message_type === 2 || m.message_type === 3 || m.attachments
      );

      if (multimediaMessages.length > 0) {
        logger.info('[messageApi]', `Found ${multimediaMessages.length} multimedia messages in response`, {
          conversationId: params.conversationId,
          multimediaCount: multimediaMessages.length,
        });

        multimediaMessages.forEach(msg => {
          // Log array details with actual content
          const attachmentsInfo = Array.isArray(msg.attachments)
            ? { isArray: true, length: msg.attachments.length, firstItem: msg.attachments[0] }
            : { isArray: false, type: typeof msg.attachments, value: msg.attachments };

          logger.info('[messageApi]', 'Multimedia message details', {
            id: msg.id,
            message_type: msg.message_type,
            hasAttachments: !!msg.attachments,
            attachmentsInfo,
            attachmentsParsed: typeof msg.attachments === 'string'
              ? 'STRING (not parsed)'
              : (msg.attachments ? 'OBJECT (parsed)' : 'NULL'),
            sender_role: msg.sender_role,
            created_at: msg.created_at,
          });

          // CRITICAL DEBUG: For message 37853e60, log FULL attachments structure
          if (msg.id === '37853e60-3fe3-47e3-85da-22d051d7c9b9') {
            console.log('🔍 [CRITICAL DEBUG] Message 37853e60 attachments:', JSON.stringify(msg.attachments, null, 2));
          }
        });
      }
    }

    // Log successful return
    logger.info('[messageApi]', 'getMessages() completed successfully', {
      conversationId: params.conversationId,
      returnedCount: response.data.items.length,
      duration: `${duration}ms`,
    });

    return response.data.items;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error with full context
    logger.error('[messageApi]', 'getMessages() failed', {
      conversationId: params.conversationId,
      offset: params.offset ?? 0,
      limit: params.limit ?? 50,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : String(error),
      // @ts-ignore - axios error structure
      status: error?.response?.status,
      // @ts-ignore - axios error structure
      statusText: error?.response?.statusText,
    });

    throw error;
  }
}
