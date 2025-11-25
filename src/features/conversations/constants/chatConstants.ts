/**
 * Chat System Constants
 * Centralized configuration values for chat features
 * Use these instead of hardcoded magic numbers throughout the codebase
 */

/**
 * Timeout configurations for chat operations
 */
export const CHAT_TIMEOUTS = {
  /** AI response timeout in milliseconds (30 seconds) */
  AI_RESPONSE: 30000,

  /** Typing indicator auto-hide timeout in milliseconds (3 seconds) */
  TYPING_INDICATOR: 3000,

  /** Time window for matching optimistic messages in milliseconds (5 seconds) */
  MESSAGE_RECONCILIATION_WINDOW: 5000,
} as const;

/**
 * Pagination configuration for chat history
 */
export const CHAT_PAGINATION = {
  /** Number of messages to load per page */
  PAGE_SIZE: 50,

  /** Initial load size (same as page size) */
  INITIAL_LOAD: 50,
} as const;

/**
 * Message constraints and validation
 */
export const MESSAGE_CONSTRAINTS = {
  /** Maximum message length in characters */
  MAX_LENGTH: 5000,

  /** Minimum message length (trimmed) */
  MIN_LENGTH: 1,
} as const;

/**
 * Message type enum values (from database)
 */
export const MESSAGE_TYPES = {
  TEXT: 1,
  IMAGE: 2,
  FILE: 3,
} as const;

/**
 * Sender role enum values (from database)
 */
export const SENDER_ROLES = {
  CUSTOMER: 1,
  AI_AGENT: 2,
  HUMAN_AGENT: 3,
  SYSTEM: 4,
} as const;

/**
 * Message status enum values (from database)
 */
export const MESSAGE_STATUS = {
  DELETED: 0,
  ACTIVE: 1,
} as const;

/**
 * Special identifiers used in chat system
 */
export const CHAT_IDENTIFIERS = {
  /** Studio user ID for test/preview sessions */
  STUDIO_USER_ID: 'studio_user',

  /** Studio customer name for test conversations */
  STUDIO_CUSTOMER_NAME: 'studio_preview_user',

  /** Temp ID prefix for optimistic messages */
  TEMP_ID_PREFIX: 'temp-',
} as const;

/**
 * Channel naming conventions for Supabase real-time
 */
export const CHANNEL_NAMES = {
  /** Chat channel format: chat:{conversationId} */
  CHAT: (conversationId: string) => `chat:${conversationId}`,

  /** Conversations channel format: conversations_{agentId} */
  CONVERSATIONS: (agentId: string) => `conversations_${agentId}`,

  /** Messages channel format: chats_{conversationId} */
  MESSAGES: (conversationId: string) => `chats_${conversationId}`,
} as const;

/**
 * Event types for real-time subscriptions
 */
export const REALTIME_EVENTS = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  TYPING: 'typing',
} as const;

/**
 * UI-level message send status for optimistic updates
 */
export const MESSAGE_SEND_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  ERROR: 'error',
} as const;

/**
 * Type exports for type-safe usage
 */
export type MessageSendStatus = typeof MESSAGE_SEND_STATUS[keyof typeof MESSAGE_SEND_STATUS];
export type RealtimeEventType = typeof REALTIME_EVENTS[keyof typeof REALTIME_EVENTS];
