/**
 * Conversation and Message Types
 * Matching Supabase database schema
 */

// === Conversation Types ===

export enum ConversationStatus {
  Draft = 0,
  Open = 1,
  Closed = 2,
  Archived = 3,
  Deleted = 4,
}

export enum ConversationSentiment {
  Negative = 1,
  Unhappy = 2,
  Neutral = 3,
  Happy = 4,
}

export interface CustomerMetadata {
  profile_picture?: string;
  platform?: string;
  [key: string]: unknown;
}

export interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_metadata: CustomerMetadata | null;
  agent_id: string;
  source: string; // "web", "whatsapp", "instagram", etc.
  status: ConversationStatus;
  last_message: string | null;
  last_message_at: string | null;
  is_ai: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // AI Analysis fields
  topic: string | null;
  sentiment: ConversationSentiment | null;
  requires_human_attention: boolean;
  urgent: boolean;
  am_not_sure_how_to_answer: boolean;
  analysis_updated_at: string | null;

  // Platform integration
  platform_conversation_id: string | null;
  platform_customer_id: string | null;
  platform_connection_id: string | null;
}

// === Message Types ===

export enum MessageType {
  Text = 1,
  Image = 2,
  File = 3,
}

export enum SenderRole {
  Customer = 1,
  AiAgent = 2,
  HumanAgent = 3,
  System = 4,
}

export enum MessageStatus {
  Deleted = 0,
  Active = 1,
}

/**
 * UI-level message send status for optimistic updates
 * This is separate from MessageStatus which is backend status
 */
export enum MessageSendStatus {
  Sending = 'sending',
  Sent = 'sent',
  Error = 'error',
}

export interface MessageAttachment {
  url: string;
  type: string;
  filename?: string;
}

export interface MessageAttachments {
  images?: MessageAttachment[];
  files?: MessageAttachment[];
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  message: string | null;
  message_type: MessageType;
  attachments: string | null; // JSON string of MessageAttachments
  sender_id: string | null;
  sender_role: SenderRole;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
  platform_message_id: string | null;
  action_metadata: Record<string, any> | null;

  // UI-only fields for optimistic updates
  correlation_id?: string; // Unique ID for matching optimistic messages with backend responses
  sendStatus?: MessageSendStatus; // 'sending' | 'sent' | 'error'
  isOptimistic?: boolean; // true for messages not yet confirmed by backend
}

// === Helper Types ===

export interface SendMessageRequest {
  conversationId: string;
  message: string;
  senderRole?: SenderRole;
  senderId?: string;
  messageType?: MessageType;
  attachments?: MessageAttachments;
}

export interface SendMessageWithAIRequest {
  conversationId: string;
  message: string;
  agentId: string;
  messageType?: MessageType;
  attachments?: string; // JSON string
  source?: string;
  platformConversationId?: string;
}

export interface UpdateConversationRequest {
  conversationId: string;
  status?: ConversationStatus;
  requiresHumanAttention?: boolean;
  urgent?: boolean;
  topic?: string;
  sentiment?: ConversationSentiment;
}

export interface CreateConversationRequest {
  agentId: string;
  customerName: string;
  customerMetadata?: CustomerMetadata;
  initialMessage?: string;
  customerId?: string;
}

// === Utility Functions ===

export const parseAttachments = (attachmentsJson: string | null): MessageAttachments | null => {
  if (!attachmentsJson) return null;
  try {
    return JSON.parse(attachmentsJson) as MessageAttachments;
  } catch {
    return null;
  }
};

export const stringifyAttachments = (attachments: MessageAttachments): string => {
  return JSON.stringify(attachments);
};

export const isCustomerMessage = (message: ChatMessage): boolean => {
  return message.sender_role === SenderRole.Customer;
};

export const isAIMessage = (message: ChatMessage): boolean => {
  return message.sender_role === SenderRole.AiAgent;
};

export const isHumanMessage = (message: ChatMessage): boolean => {
  return message.sender_role === SenderRole.HumanAgent;
};

export const isSystemMessage = (message: ChatMessage): boolean => {
  return message.sender_role === SenderRole.System;
};

export const isMessageDeleted = (message: ChatMessage): boolean => {
  return message.status === MessageStatus.Deleted;
};

export const getConversationStatusLabel = (status: ConversationStatus): string => {
  const labels: Record<ConversationStatus, string> = {
    [ConversationStatus.Draft]: 'Draft',
    [ConversationStatus.Open]: 'Open',
    [ConversationStatus.Closed]: 'Closed',
    [ConversationStatus.Archived]: 'Archived',
    [ConversationStatus.Deleted]: 'Deleted',
  };
  return labels[status];
};

export const getSentimentLabel = (sentiment: ConversationSentiment | null): string => {
  if (!sentiment) return 'Unknown';
  const labels: Record<ConversationSentiment, string> = {
    [ConversationSentiment.Negative]: 'Negative',
    [ConversationSentiment.Unhappy]: 'Unhappy',
    [ConversationSentiment.Neutral]: 'Neutral',
    [ConversationSentiment.Happy]: 'Happy',
  };
  return labels[sentiment];
};
