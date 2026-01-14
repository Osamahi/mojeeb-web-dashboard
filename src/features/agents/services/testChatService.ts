/**
 * Test Chat Service
 * API calls for testing agent responses in studio mode
 * Uses production endpoints - no backend changes required
 */

import api from '@/lib/api';
import { logger } from '@/lib/logger';

// Types
export interface WidgetConfiguration {
  id: string;
  agent_id: string;
  name: string;
}

export interface StudioConversation {
  id: string;
  customer_id: string;
  customer_name: string;
  agent_id: string;
  source: string;
  status: number;
  is_ai: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SendMessageRequest {
  conversationId: string;
  message: string;
  agentId: string;
  messageType?: number;
  attachments?: string | null;
  source?: string | null;
  platformConversationId?: string | null;
}

export interface MessageResponse {
  id: string;
  conversation_id: string;
  message: string;
  message_type: number;
  sender_id: string | null;
  sender_role: number;
  status: number;
  created_at: string;
  updated_at: string;
}

// Constants
const STUDIO_CUSTOMER_NAME = 'studio_preview_user';
const MESSAGE_TYPE_TEXT = 1;

/**
 * Fetch widget configuration for agent
 */
async function getAgentWidget(agentId: string): Promise<WidgetConfiguration> {
  const { data } = await api.get<{ data: WidgetConfiguration }>(
    `/api/widget/by-agent/${agentId}`
  );
  return data.data;
}

/**
 * Initialize studio test conversation
 * @param widgetId - Widget ID to use for conversation
 * @param customerName - Optional customer name (falls back to STUDIO_CUSTOMER_NAME)
 */
async function initStudioConversation(
  widgetId: string,
  customerName?: string
): Promise<StudioConversation> {
  const { data } = await api.post<StudioConversation>(
    '/api/conversations/initiate-widget-conversation',
    {
      widget_id: widgetId,
      customer_name: customerName || STUDIO_CUSTOMER_NAME,
      customer_metadata: null,
      initial_message: null,
      customer_id: null,
      source: 'test',
    }
  );

  if (!data.is_ai) {
    logger.warn('Conversation AI disabled - responses will not be generated');
  }

  return data;
}

/**
 * Send test message and trigger AI response
 * AI response arrives via Supabase real-time
 */
async function sendTestMessage(request: SendMessageRequest): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>(
    '/api/chat/generate-response',
    {
      conversationId: request.conversationId,
      message: request.message,
      agentId: request.agentId,
      messageType: request.messageType ?? MESSAGE_TYPE_TEXT,
      attachments: request.attachments ?? null,
      source: request.source ?? null,
      platformConversationId: request.platformConversationId ?? null,
    },
    {
      headers: {
        'X-No-Retry': 'true', // Prevent retry on timeout - AI generation can take >30s
      },
    }
  );

  return data;
}

export const testChatService = {
  getAgentWidget,
  initStudioConversation,
  sendTestMessage,
};
