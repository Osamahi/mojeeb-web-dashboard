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

    // Don't fetch if already loading or no more data (unless refreshing)
    if (isLoading || (!refresh && !hasMore && currentConversationId === conversationId)) {
      return;
    }

    // If conversation changed, reset everything
    if (conversationId !== currentConversationId) {
      set({
        messages: [],
        hasMore: true,
        currentConversationId: conversationId,
      });
    }

    set({ isLoading: true, error: null });

    try {
      const offset = refresh ? 0 : messages.length;
      const data = await getMessages({ conversationId, offset, limit: CHAT_PAGINATION.PAGE_SIZE });

      // If refreshing, replace all. Otherwise, prepend older messages
      const newMessages = refresh ? data : [...data, ...messages];

      set({
        messages: newMessages,
        hasMore: data.length === CHAT_PAGINATION.PAGE_SIZE,
        isLoading: false,
        currentConversationId: conversationId,
      });
    } catch (error: CatchError) {
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
    const { messages } = get();
    // Prevent duplicates
    if (messages.some((m) => m.id === message.id)) return;
    set({ messages: [...messages, message] });
  },

  updateMessage: (id: string, updates: Partial<ChatMessage>) => {
    const { messages } = get();
    const newMessages = messages.map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    );
    set({ messages: newMessages });
  },

  removeMessage: (id: string) => {
    const { messages } = get();
    set({ messages: messages.filter((msg) => msg.id !== id) });
  },
}));
