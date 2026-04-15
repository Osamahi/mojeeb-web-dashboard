/**
 * Chat Store - Zustand
 * Manages chat message history and cursor-based pagination.
 * Real-time subscriptions handled by useChatEngine hook.
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
  /** Base64 cursor pointing at the OLDEST message currently in `messages`. Used by loadMore. */
  nextCursor: string | null;
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
  nextCursor: null,
  error: null,

  // Fetch messages — first page on conversation open, or older page on loadMore.
  // `refresh = true` resets the page and fetches the newest messages.
  // `refresh = false` uses the stored nextCursor to fetch the next older page.
  fetchMessages: async (conversationId: string, refresh = false) => {
    const { isLoading, hasMore, currentConversationId, nextCursor } = get();

    // Don't fetch if already loading or no more data (unless refreshing)
    if (isLoading || (!refresh && !hasMore && currentConversationId === conversationId)) {
      return;
    }

    // If conversation changed, reset everything AND set loading in one batch
    // (prevents flash of empty state between clearing messages and setting isLoading)
    if (conversationId !== currentConversationId) {
      set({
        messages: [],
        hasMore: true,
        nextCursor: null,
        currentConversationId: conversationId,
        isLoading: true,
        error: null,
      });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      // For a refresh (or first load), no cursor → backend returns newest page.
      // For loadMore, use the stored cursor → backend returns the next older page.
      const cursor = refresh ? null : nextCursor;

      const response = await getMessages({
        conversationId,
        cursor,
        limit: CHAT_PAGINATION.PAGE_SIZE,
      });

      // Response items are already in ascending chronological order.
      // On refresh, replace. On loadMore, prepend older messages.
      const { messages: currentMessages } = get();
      const newMessages = refresh
        ? response.items
        : [...response.items, ...currentMessages];

      set({
        messages: newMessages,
        hasMore: response.has_more,
        nextCursor: response.next_cursor,
        isLoading: false,
        currentConversationId: conversationId,
      });
    } catch (error: CatchError) {
      logger.error('[chatStore]', 'fetchMessages() error', {
        conversationId,
        refresh,
        error: error instanceof Error ? error.message : String(error),
      });

      // Centralized error handling
      handleMessageFetchError(error, {
        component: 'chatStore',
        conversationId,
      });

      set({
        error: 'Failed to load messages',
        isLoading: false,
      });
    }
  },

  // Load More (older messages) — uses the stored nextCursor
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
      nextCursor: null,
      error: null,
    });
  },

  // Storage Adapter Actions (for ChatStorageAdapter compatibility)
  setMessages: (messages: ChatMessage[]) => {
    set({ messages });
  },

  addMessage: (message: ChatMessage) => {
    const { messages } = get();

    // Prevent duplicates
    if (messages.some((m) => m.id === message.id)) {
      return;
    }

    set({ messages: [...messages, message] });
  },

  updateMessage: (id: string, updates: Partial<ChatMessage>) => {
    const { messages } = get();
    const existingMessage = messages.find((msg) => msg.id === id);

    if (!existingMessage) {
      return;
    }

    const newMessages = messages.map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    );
    set({ messages: newMessages });
  },

  removeMessage: (id: string) => {
    const { messages } = get();
    const messageExists = messages.some((msg) => msg.id === id);

    if (!messageExists) {
      return;
    }

    set({ messages: messages.filter((msg) => msg.id !== id) });
  },
}));
