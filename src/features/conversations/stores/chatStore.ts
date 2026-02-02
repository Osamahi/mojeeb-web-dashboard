/**
 * Chat Store - Zustand
 * Manages chat message history and pagination
 * Real-time subscriptions handled by useChatEngine hook
 */

import { create } from 'zustand';
import type { ChatMessage } from '../types';
import { getMessages } from '../services/messageApi';
import type { CatchError } from '@/lib/errors';
import { handleMessageFetchError } from '../utils/chatErrorHandler';
import { CHAT_PAGINATION } from '../constants/chatConstants';
import { logger } from '@/lib/logger';

interface ChatStore {
  // State
  messages: ChatMessage[];
  currentConversationId: string | null;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;

  // Actions
  fetchMessages: (conversationId: string, refresh?: boolean) => Promise<void>;
  loadMore: (conversationId: string) => Promise<void>;
  changeConversation: (conversationId: string) => void;
  clearMessages: () => void;

  // Storage adapter actions (for ChatStorageAdapter compatibility)
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial State
  messages: [],
  currentConversationId: null,
  isLoading: false,
  hasMore: true,
  error: null,

  // Fetch Messages (for pagination/history only - real-time handled by useChatEngine)
  fetchMessages: async (conversationId: string, refresh = false) => {
    const { messages, isLoading, hasMore, currentConversationId } = get();
    const startTime = Date.now();

    // Log function entry
    logger.info('[chatStore]', 'fetchMessages() called', {
      conversationId,
      refresh,
      currentMessagesCount: messages.length,
      currentConversationId,
      isLoading,
      hasMore,
    });

    // Don't fetch if already loading or no more data (unless refreshing)
    if (isLoading || (!refresh && !hasMore && currentConversationId === conversationId)) {
      logger.debug('[chatStore]', 'Fetch skipped', {
        conversationId,
        reason: isLoading ? 'already loading' : 'no more data',
      });
      return;
    }

    // If conversation changed, reset everything
    if (conversationId !== currentConversationId) {
      logger.info('[chatStore]', 'Conversation changed - clearing old messages', {
        oldConversationId: currentConversationId,
        newConversationId: conversationId,
        messagesCleared: messages.length,
      });

      set({
        messages: [],
        hasMore: true,
        currentConversationId: conversationId,
      });
    }

    set({ isLoading: true, error: null });

    try {
      const offset = refresh ? 0 : messages.length;

      // Log before API call
      logger.info('[chatStore]', 'Fetching messages from API', {
        conversationId,
        offset,
        limit: CHAT_PAGINATION.PAGE_SIZE,
        refresh,
      });

      const data = await getMessages({ conversationId, offset, limit: CHAT_PAGINATION.PAGE_SIZE });

      // If refreshing, replace all. Otherwise, prepend older messages
      const newMessages = refresh ? data : [...data, ...messages];

      const duration = Date.now() - startTime;

      // Log state update
      logger.info('[chatStore]', 'State updated after message fetch', {
        conversationId,
        messagesBeforeCount: messages.length,
        messagesAfterCount: newMessages.length,
        fetchedCount: data.length,
        hasMore: data.length === CHAT_PAGINATION.PAGE_SIZE,
        duration: `${duration}ms`,
      });

      // Log message IDs for debugging (first 3 and last 3)
      if (newMessages.length > 0) {
        const messageIds = newMessages.map(m => m.id);
        const sample = messageIds.length <= 6
          ? messageIds
          : [...messageIds.slice(0, 3), '...', ...messageIds.slice(-3)];

        logger.debug('[chatStore]', 'Message IDs in store after update', {
          conversationId,
          messageIds: sample,
          total: messageIds.length,
        });
      }

      set({
        messages: newMessages,
        hasMore: data.length === CHAT_PAGINATION.PAGE_SIZE,
        isLoading: false,
        currentConversationId: conversationId,
      });
    } catch (error: CatchError) {
      const duration = Date.now() - startTime;

      // Log error with context
      logger.error('[chatStore]', 'fetchMessages() error', {
        conversationId,
        refresh,
        offset: refresh ? 0 : messages.length,
        messagesInStore: messages.length,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
      });

      // Centralized error handling
      handleMessageFetchError(error, {
        component: 'chatStore',
        conversationId,
        offset: refresh ? 0 : messages.length,
      });

      set({
        error: 'Failed to load messages',
        isLoading: false
      });
    }
  },

  // Load More (older messages)
  loadMore: async (conversationId: string) => {
    await get().fetchMessages(conversationId, false);
  },

  // Change Conversation
  changeConversation: (conversationId: string) => {
    get().clearMessages();
    get().fetchMessages(conversationId, true);
  },

  // Clear Messages
  clearMessages: () => {
    set({
      messages: [],
      currentConversationId: null,
      isLoading: false,
      hasMore: true,
      error: null,
    });
  },

  // Storage Adapter Actions (for ChatStorageAdapter compatibility)
  setMessages: (messages: ChatMessage[]) => {
    set({ messages });
  },

  addMessage: (message: ChatMessage) => {
    const { messages, currentConversationId } = get();

    // Prevent duplicates
    if (messages.some((m) => m.id === message.id)) {
      logger.debug('[chatStore]', 'addMessage() - duplicate prevented', {
        messageId: message.id,
        conversationId: currentConversationId,
      });
      return;
    }

    logger.info('[chatStore]', 'addMessage() - message added to store', {
      messageId: message.id,
      conversationId: message.conversation_id,
      senderRole: message.sender_role,
      messageType: message.message_type,
      hasAttachments: !!message.attachments,
      newTotal: messages.length + 1,
    });

    set({ messages: [...messages, message] });
  },

  updateMessage: (id: string, updates: Partial<ChatMessage>) => {
    const { messages, currentConversationId } = get();
    const existingMessage = messages.find((msg) => msg.id === id);

    if (!existingMessage) {
      logger.warn('[chatStore]', 'updateMessage() - message not found', {
        messageId: id,
        conversationId: currentConversationId,
      });
      return;
    }

    logger.info('[chatStore]', 'updateMessage() - message updated in store', {
      messageId: id,
      conversationId: currentConversationId,
      updatedFields: Object.keys(updates),
    });

    const newMessages = messages.map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    );
    set({ messages: newMessages });
  },

  removeMessage: (id: string) => {
    const { messages, currentConversationId } = get();
    const messageExists = messages.some((msg) => msg.id === id);

    if (!messageExists) {
      logger.warn('[chatStore]', 'removeMessage() - message not found', {
        messageId: id,
        conversationId: currentConversationId,
      });
      return;
    }

    logger.info('[chatStore]', 'removeMessage() - message removed from store', {
      messageId: id,
      conversationId: currentConversationId,
      newTotal: messages.length - 1,
    });

    set({ messages: messages.filter((msg) => msg.id !== id) });
  },
}));
