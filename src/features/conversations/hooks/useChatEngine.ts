/**
 * ChatEngine Hook
 * Core chat logic with optimistic updates and real-time subscriptions
 * Storage-agnostic via ChatStorageAdapter pattern
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ChatStorageAdapter } from './useChatStorage';
import type { ChatMessage, MessageSendStatus } from '../types/conversation.types';
import { MessageStatus, SenderRole, MessageType } from '../types/conversation.types';
import {
  handleMessageSendError,
  handleSubscriptionError,
  handleAITimeoutError,
} from '../utils/chatErrorHandler';
import {
  CHAT_TIMEOUTS,
  CHAT_IDENTIFIERS,
  CHANNEL_NAMES,
} from '../constants/chatConstants';
import { useOnAppResume } from '@/contexts/AppLifecycleContext';

// === Types ===

export interface ChatEngineConfig {
  /** Conversation ID to subscribe to */
  conversationId: string;

  /** Agent ID for AI responses (required for test mode) */
  agentId?: string;

  /** Storage adapter */
  storage: ChatStorageAdapter;

  /** Enable pagination (production only) */
  enablePagination?: boolean;

  /** Custom error handler */
  onError?: (error: Error) => void;

  /** API service for sending messages */
  sendMessageFn: (params: {
    conversationId: string;
    message: string;
    agentId?: string;
    messageType?: MessageType;
    attachments?: string; // JSON string of attachments
  }) => Promise<ChatMessage>;
}

export interface ChatEngineReturn {
  /** All messages (includes optimistic) */
  messages: ChatMessage[];

  /** Currently sending a message */
  isSending: boolean;

  /** Loading initial messages */
  isLoading: boolean;

  /** AI is typing (broadcast event) */
  isAITyping: boolean;

  /** Has more messages to load (pagination) */
  hasMore?: boolean;

  /** Send message with optimistic update */
  sendMessage: (content: string, attachments?: string) => Promise<void>;

  /** Load more messages (pagination) */
  loadMore?: () => Promise<void>;

  /** Retry failed message */
  retryMessage: (messageId: string) => Promise<void>;

  /** Clear all messages */
  clearMessages: () => void;
}

// === Helpers ===

/**
 * Generate temporary UUID for optimistic messages
 */
const generateTempId = (correlationId: string): string => {
  return `${CHAT_IDENTIFIERS.TEMP_ID_PREFIX}${correlationId}`;
};

/**
 * Generate unique correlation ID for tracking optimistic messages
 */
const generateCorrelationId = (): string => {
  return crypto.randomUUID();
};

/**
 * Backend message shape from Supabase
 */
interface BackendMessage {
  id: string;
  conversation_id: string;
  message: string;
  message_type?: string;
  attachments?: string | null;
  sender_id?: string | null;
  sender_role: string;
  status?: string;
  created_at: string;
  updated_at: string;
  platform_message_id?: string | null;
  action_metadata?: Record<string, unknown> | null;
}

/**
 * Transform backend message to ChatMessage
 */
const transformMessage = (backendMsg: BackendMessage): ChatMessage => {
  return {
    id: backendMsg.id,
    conversation_id: backendMsg.conversation_id,
    message: backendMsg.message,
    message_type: backendMsg.message_type || MessageType.Text,
    attachments: backendMsg.attachments || null,
    sender_id: backendMsg.sender_id || null,
    sender_role: backendMsg.sender_role,
    status: backendMsg.status || MessageStatus.Active,
    created_at: backendMsg.created_at,
    updated_at: backendMsg.updated_at,
    platform_message_id: backendMsg.platform_message_id || null,
    action_metadata: backendMsg.action_metadata || null,
  };
};

/**
 * Check if two messages are the same (for reconciliation)
 * Prioritizes correlation_id matching (reliable), falls back to time-window matching (legacy)
 */
const messagesMatch = (msg1: ChatMessage, msg2: ChatMessage): boolean => {
  // Reliable: Match by correlation ID if both messages have one
  if (msg1.correlation_id && msg2.correlation_id) {
    return msg1.correlation_id === msg2.correlation_id;
  }

  // Fallback: Legacy time-window + content matching (for backward compatibility)
  return (
    msg1.message === msg2.message &&
    msg1.sender_role === msg2.sender_role &&
    Math.abs(new Date(msg1.created_at).getTime() - new Date(msg2.created_at).getTime()) < CHAT_TIMEOUTS.MESSAGE_RECONCILIATION_WINDOW
  );
};

// === Main Hook ===

/**
 * Unified chat engine with real-time updates and optimistic message handling
 *
 * @description
 * Core chat logic providing:
 * - Real-time message subscriptions via Supabase
 * - Optimistic message updates with correlation ID matching
 * - AI response timeout detection and recovery
 * - Typing indicator broadcasts
 * - Storage-agnostic architecture via adapter pattern
 *
 * @example
 * ```ts
 * // For production chat (persistent storage)
 * const storage = useZustandChatStorage();
 * const { messages, isSending, sendMessage } = useChatEngine({
 *   conversationId: "conv-123",
 *   agentId: "agent-456",
 *   storage,
 *   sendMessageFn: async (params) =>
 *     await chatApiService.sendMessageWithAI(params),
 * });
 *
 * // For test chat (ephemeral storage)
 * const storage = useLocalChatStorage();
 * const { messages, sendMessage } = useChatEngine({
 *   conversationId: testConversation.id,
 *   storage,
 *   sendMessageFn: async (params) =>
 *     await testChatService.sendTestMessage(params),
 * });
 * ```
 *
 * @param config - Configuration object for chat engine
 * @param config.conversationId - Unique conversation identifier
 * @param config.agentId - Optional agent ID for AI responses
 * @param config.storage - Storage adapter for message persistence
 * @param config.enablePagination - Enable pagination (currently unused)
 * @param config.onError - Custom error callback
 * @param config.sendMessageFn - Function to send messages to backend
 *
 * @returns Chat engine interface with messages, loading states, and actions
 */
export function useChatEngine(config: ChatEngineConfig): ChatEngineReturn {
  const {
    conversationId,
    agentId,
    storage,
    enablePagination = false,
    onError,
    sendMessageFn,
  } = config;

  // State
  const [isSending, setIsSending] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);

  // Refs
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optimisticMessagesRef = useRef<Map<string, ChatMessage>>(new Map());

  // === Optimistic Update Helpers ===

  const addOptimisticMessage = useCallback(
    (tempId: string, message: ChatMessage) => {
      optimisticMessagesRef.current.set(tempId, message);
      storage.addMessage(message);
    },
    [storage]
  );

  const removeOptimisticMessage = useCallback(
    (tempId: string) => {
      optimisticMessagesRef.current.delete(tempId);
    },
    []
  );

  // === Timeout Management ===

  const clearAITimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startAITimeout = useCallback(() => {
    clearAITimeout();
    timeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      handleAITimeoutError({
        component: 'useChatEngine',
        conversationId,
        agentId,
      });
      setIsSending(false);
    }, CHAT_TIMEOUTS.AI_RESPONSE);
  }, [clearAITimeout, conversationId, agentId]);

  // === Real-time Subscription ===

  const subscribeToMessages = useCallback(() => {
    if (!conversationId) return;

    // Unsubscribe existing
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    const handleInsert = (payload: RealtimePostgresChangesPayload<BackendMessage>) => {
      if (!payload.new || !isMountedRef.current) return;

      try {
        const newMessage = transformMessage(payload.new);

        // Check if this is a backend confirmation of our optimistic message
        let reconciledOptimistic = false;
        for (const [tempId, optimisticMsg] of optimisticMessagesRef.current.entries()) {
          if (messagesMatch(optimisticMsg, newMessage)) {
            // Replace optimistic message with real backend message
            logger.info('Reconciling optimistic message', {
              tempId,
              realId: newMessage.id,
              correlationId: optimisticMsg.correlation_id,
              matchedBy: optimisticMsg.correlation_id ? 'correlation_id' : 'time-window',
            });

            storage.updateMessage(tempId, {
              id: newMessage.id,
              correlation_id: optimisticMsg.correlation_id, // Preserve correlation ID
              sendStatus: 'sent' as MessageSendStatus,
              isOptimistic: false,
              created_at: newMessage.created_at,
              updated_at: newMessage.updated_at,
            });

            removeOptimisticMessage(tempId);
            reconciledOptimistic = true;
            break; // Exit early - only one match per message
          }
        }

        // If not an optimistic reconciliation, add as new message
        if (!reconciledOptimistic) {
          storage.addMessage(newMessage);

          // If this is an AI response, clear sending state
          if (newMessage.sender_role === SenderRole.AiAgent) {
            setIsSending(false);
            clearAITimeout();
          }
        }
      } catch (error) {
        logger.error('Error processing real-time INSERT', error);
      }
    };

    const handleUpdate = (payload: RealtimePostgresChangesPayload<BackendMessage>) => {
      if (!payload.new || !isMountedRef.current) return;

      try {
        const updatedMessage = transformMessage(payload.new);
        storage.updateMessage(updatedMessage.id, updatedMessage);
      } catch (error) {
        logger.error('Error processing real-time UPDATE', error);
      }
    };

    const handleTyping = (payload: { payload: { user_id: string; is_typing: boolean } }) => {
      if (!isMountedRef.current) return;

      const { user_id, is_typing } = payload.payload;

      // Only show typing indicator if it's not from the studio user (us)
      if (user_id !== CHAT_IDENTIFIERS.STUDIO_USER_ID) {
        setIsAITyping(is_typing);

        // Auto-hide typing indicator after 3 seconds of no updates
        if (is_typing) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            if (!isMountedRef.current) return; // Prevent setState on unmounted component
            setIsAITyping(false);
            typingTimeoutRef.current = null; // Clear ref to prevent memory leak
          }, CHAT_TIMEOUTS.TYPING_INDICATOR);
        } else {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null; // Clear ref to prevent memory leak
          }
        }
      }
    };

    const channel = supabase
      .channel(CHANNEL_NAMES.CHAT(conversationId))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `conversation_id=eq.${conversationId}`,
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `conversation_id=eq.${conversationId}`,
        },
        handleUpdate
      )
      .on('broadcast', { event: 'typing' }, handleTyping)
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Check if tab is hidden - if so, this is expected behavior
          const isExpectedDisconnection = document.visibilityState === 'hidden';

          if (isExpectedDisconnection) {
            // Tab is hidden - connection drop is expected, just log as debug
            logger.debug('Chat subscription disconnected (tab hidden)', {
              component: 'useChatEngine',
              conversationId,
              subscriptionStatus: status,
            });
          } else {
            // Unexpected disconnection - log as error for debugging
            handleSubscriptionError(err || new Error(`Subscription ${status}`), {
              component: 'useChatEngine',
              conversationId,
              subscriptionStatus: status,
            });
          }
        } else if (status === 'SUBSCRIBED') {
          logger.info('Successfully subscribed to conversation', {
            conversationId,
          });
        }
      });

    channelRef.current = channel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, clearAITimeout, removeOptimisticMessage]);
  // Note: `storage` omitted from deps - it's stable and doesn't need to trigger re-subscription

  // === Send Message (Optimistic) ===

  const sendMessage = useCallback(
    async (content: string, attachments?: string) => {
      // Allow empty content if attachments are present (for voice messages)
      const hasContent = content.trim().length > 0;
      const hasAttachments = attachments && attachments.trim().length > 0;

      if ((!hasContent && !hasAttachments) || !conversationId) {
        return;
      }

      // Generate correlation ID for reliable message matching
      const correlationId = generateCorrelationId();
      const tempId = generateTempId(correlationId);

      // Detect message type from attachments
      const detectMessageType = (attachmentsJson?: string): MessageType => {
        if (!attachmentsJson) return MessageType.Text;

        try {
          const parsed = JSON.parse(attachmentsJson);
          if (parsed.audio && parsed.audio.length > 0) return MessageType.Audio;
          if (parsed.images && parsed.images.length > 0) return MessageType.Image;
          return MessageType.Text;
        } catch {
          return MessageType.Text;
        }
      };

      // 1. Create optimistic message
      const optimisticMessage: ChatMessage = {
        id: tempId,
        conversation_id: conversationId,
        message: content,
        message_type: detectMessageType(attachments),
        attachments: attachments || null,
        sender_id: null,
        sender_role: SenderRole.Customer,
        status: MessageStatus.Active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        platform_message_id: null,
        action_metadata: null,
        // UI-only fields
        correlation_id: correlationId,
        sendStatus: 'sending' as MessageSendStatus,
        isOptimistic: true,
      };

      // 2. Add to UI immediately (optimistic update)
      addOptimisticMessage(tempId, optimisticMessage);
      setIsSending(true);
      startAITimeout();

      try {
        // 3. Send to backend (non-blocking for UI)
        const backendMessage = await sendMessageFn({
          conversationId,
          message: content,
          agentId,
          messageType: detectMessageType(attachments),
          attachments,
        });

        if (!isMountedRef.current) return;

        // 4. Backend returns real message - reconciliation happens in real-time handler
        logger.info('Message sent successfully', {
          tempId,
          realId: backendMessage.id,
        });

        // Note: We don't update storage here - real-time INSERT handler will reconcile
      } catch (error) {
        if (!isMountedRef.current) return;

        // Mark optimistic message as error
        storage.updateMessage(tempId, {
          sendStatus: 'error' as MessageSendStatus,
        });

        setIsSending(false);
        clearAITimeout();

        // Centralized error handling
        handleMessageSendError(error, {
          component: 'useChatEngine',
          conversationId,
          agentId,
          messageId: tempId,
        });

        // Call custom error callback if provided
        onError?.(error instanceof Error ? error : new Error('Failed to send message'));
      }
    },
    [
      conversationId,
      agentId,
      sendMessageFn,
      storage,
      addOptimisticMessage,
      startAITimeout,
      clearAITimeout,
      onError,
    ]
  );

  // === Retry Message ===

  const retryMessage = useCallback(
    async (messageId: string) => {
      const message = storage.messages.find((m) => m.id === messageId);
      if (!message || !message.message) return;

      // Remove failed message
      storage.removeMessage(messageId);

      // Resend
      await sendMessage(message.message);
    },
    [storage, sendMessage]
  );

  // === Clear Messages ===

  const clearMessages = useCallback(() => {
    storage.clearMessages();
    optimisticMessagesRef.current.clear();
    clearAITimeout();
    setIsSending(false);
  }, [storage, clearAITimeout]);

  // === Lifecycle ===

  // Subscribe to real-time on mount
  useEffect(() => {
    isMountedRef.current = true;
    subscribeToMessages();

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      clearAITimeout();
      // Clear typing timeout to prevent memory leak
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [subscribeToMessages, clearAITimeout]);

  // Handle app resume - reconnect Supabase real-time channels when tab becomes visible
  // Uses global AppLifecycleProvider instead of per-component listeners
  useOnAppResume(() => {
    if (!conversationId) {
      logger.debug('Skipping chat reconnection - no conversationId', { component: 'useChatEngine' });
      return;
    }

    logger.info('App resumed - reconnecting chat subscription', {
      component: 'useChatEngine',
      conversationId,
    });

    // Unsubscribe from old channel
    if (channelRef.current) {
      logger.debug('Unsubscribing from old chat channel', {
        component: 'useChatEngine',
        conversationId,
      });
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Resubscribe with fresh connection
    // The subscribeToMessages callback already handles channel setup
    logger.debug('Resubscribing to chat messages', {
      component: 'useChatEngine',
      conversationId,
    });
    subscribeToMessages();
    logger.info('Chat channel reconnection complete', {
      component: 'useChatEngine',
      conversationId,
    });
  });

  // Return interface
  return {
    messages: storage.messages,
    isSending,
    isLoading: false, // Always false - initial fetch handled by caller (e.g., ChatPanel)
    isAITyping,
    hasMore: enablePagination ? false : undefined,
    sendMessage,
    loadMore: undefined,
    retryMessage,
    clearMessages,
  };
}
