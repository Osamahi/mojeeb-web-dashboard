/**
 * ChatEngine Hook
 * Core chat logic with optimistic updates and real-time subscriptions
 * Storage-agnostic via ChatStorageAdapter pattern
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ChatStorageAdapter } from './useChatStorage';
import type { ChatMessage, MessageSendStatus } from '../types/conversation.types';
import { MessageStatus, SenderRole, MessageType } from '../types/conversation.types';

// === Types ===

export interface ChatEngineConfig {
  /** Conversation ID to subscribe to */
  conversationId: string;

  /** Agent ID for AI responses (required for test mode) */
  agentId?: string;

  /** Chat mode */
  mode: 'test' | 'production';

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
  sendMessage: (content: string) => Promise<void>;

  /** Load more messages (pagination) */
  loadMore?: () => Promise<void>;

  /** Retry failed message */
  retryMessage: (messageId: string) => Promise<void>;

  /** Clear all messages */
  clearMessages: () => void;
}

// === Constants ===

const AI_RESPONSE_TIMEOUT = 30000; // 30 seconds

// === Helpers ===

/**
 * Generate temporary UUID for optimistic messages
 */
const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Transform backend message to ChatMessage
 */
const transformMessage = (backendMsg: any): ChatMessage => {
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
 */
const messagesMatch = (msg1: ChatMessage, msg2: ChatMessage): boolean => {
  return (
    msg1.message === msg2.message &&
    msg1.sender_role === msg2.sender_role &&
    Math.abs(new Date(msg1.created_at).getTime() - new Date(msg2.created_at).getTime()) < 5000 // Within 5 seconds
  );
};

// === Main Hook ===

export function useChatEngine(config: ChatEngineConfig): ChatEngineReturn {
  const {
    conversationId,
    agentId,
    mode,
    storage,
    enablePagination = false,
    onError,
    sendMessageFn,
  } = config;

  // State
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const updateOptimisticMessage = useCallback(
    (tempId: string, updates: Partial<ChatMessage>) => {
      const optimisticMsg = optimisticMessagesRef.current.get(tempId);
      if (optimisticMsg) {
        storage.updateMessage(tempId, updates);
        removeOptimisticMessage(tempId);
      }
    },
    [storage, removeOptimisticMessage]
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
      logger.warn('AI response timeout after 30 seconds');
      setIsSending(false);
    }, AI_RESPONSE_TIMEOUT);
  }, [clearAITimeout]);

  // === Real-time Subscription ===

  const subscribeToMessages = useCallback(() => {
    if (!conversationId) return;

    // Unsubscribe existing
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    const handleInsert = (payload: RealtimePostgresChangesPayload<any>) => {
      if (!payload.new || !isMountedRef.current) return;

      try {
        const newMessage = transformMessage(payload.new);

        // Check if this is a backend confirmation of our optimistic message
        let reconciledOptimistic = false;
        optimisticMessagesRef.current.forEach((optimisticMsg, tempId) => {
          if (messagesMatch(optimisticMsg, newMessage)) {
            // Replace optimistic message with real backend message
            logger.info('Reconciling optimistic message', {
              tempId,
              realId: newMessage.id,
            });

            storage.updateMessage(tempId, {
              id: newMessage.id,
              sendStatus: 'sent' as MessageSendStatus,
              isOptimistic: false,
              created_at: newMessage.created_at,
              updated_at: newMessage.updated_at,
            });

            removeOptimisticMessage(tempId);
            reconciledOptimistic = true;
          }
        });

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

    const handleUpdate = (payload: RealtimePostgresChangesPayload<any>) => {
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
      if (user_id !== 'studio_user') {
        setIsAITyping(is_typing);

        // Auto-hide typing indicator after 3 seconds of no updates
        if (is_typing) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsAITyping(false);
          }, 3000);
        } else {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
        }
      }
    };

    const channel = supabase
      .channel(`chat:${conversationId}`)
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
          logger.error(`Subscription ${status.toLowerCase()}`, err);
          toast.error('Failed to connect to real-time updates');
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
    async (content: string) => {
      if (!content.trim() || !conversationId) return;

      const tempId = generateTempId();

      // 1. Create optimistic message
      const optimisticMessage: ChatMessage = {
        id: tempId,
        conversation_id: conversationId,
        message: content,
        message_type: MessageType.Text,
        attachments: null,
        sender_id: null,
        sender_role: SenderRole.Customer,
        status: MessageStatus.Active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        platform_message_id: null,
        action_metadata: null,
        // UI-only fields
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

        logger.error('Failed to send message', error);

        // Mark optimistic message as error
        storage.updateMessage(tempId, {
          sendStatus: 'error' as MessageSendStatus,
        });

        setIsSending(false);
        clearAITimeout();

        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message';
        onError?.(error instanceof Error ? error : new Error(errorMessage));
        toast.error(errorMessage);
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
    };
  }, [subscribeToMessages, clearAITimeout]);

  // Return interface
  return {
    messages: storage.messages,
    isSending,
    isLoading,
    isAITyping,
    hasMore: enablePagination ? false : undefined, // TODO: Implement pagination
    sendMessage,
    loadMore: undefined, // TODO: Implement pagination
    retryMessage,
    clearMessages,
  };
}
