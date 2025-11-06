/**
 * Chat Store - Zustand
 * Manages chat messages with real-time Supabase subscriptions
 * Follows Flutter MobX store patterns
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ChatMessage, SendMessageWithAIRequest } from '../types';
import { SenderRole, MessageType } from '../types';
import {
  fetchMessages,
  subscribeToMessages,
  unsubscribeChannel,
  type RealtimeEventType,
} from '../services/conversationService';
import { chatApiService } from '../services/chatApiService';
import { logger } from '@/lib/logger';
import type { CatchError } from '@/lib/errors';
import { getErrorMessage } from '@/lib/errors';

const CHAT_PAGE_SIZE = 50;

interface ChatStore {
  // State
  messages: ChatMessage[];
  currentConversationId: string | null;
  isLoading: boolean;
  isSending: boolean;
  hasMore: boolean;
  error: string | null;

  // Real-time
  subscriptionChannel: RealtimeChannel | null;

  // Actions
  fetchMessages: (conversationId: string, refresh?: boolean) => Promise<void>;
  sendMessageWithAI: (request: SendMessageWithAIRequest) => Promise<void>;
  sendMessageAsAdmin: (conversationId: string, message: string, senderId: string) => Promise<void>;
  uploadAndSendImages: (
    conversationId: string,
    message: string,
    agentId: string,
    files: File[]
  ) => Promise<void>;
  loadMore: (conversationId: string) => Promise<void>;
  subscribe: (conversationId: string) => void;
  unsubscribe: () => void;
  changeConversation: (conversationId: string) => void;
  clearMessages: () => void;

  // Real-time handlers
  handleRealtimeEvent: (payload: ChatMessage[], eventType: RealtimeEventType) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial State
  messages: [],
  currentConversationId: null,
  isLoading: false,
  isSending: false,
  hasMore: true,
  error: null,
  subscriptionChannel: null,

  // Fetch Messages
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

      // Resubscribe to new conversation
      get().unsubscribe();
      get().subscribe(conversationId);
    }

    set({ isLoading: true, error: null });

    try {
      const offset = refresh ? 0 : messages.length;
      const data = await fetchMessages({ conversationId, offset, limit: CHAT_PAGE_SIZE });

      // If refreshing, replace all. Otherwise, prepend older messages
      const newMessages = refresh ? data : [...data, ...messages];

      set({
        messages: newMessages,
        hasMore: data.length === CHAT_PAGE_SIZE,
        isLoading: false,
        currentConversationId: conversationId,
      });
    } catch (error: CatchError) {
      logger.error('Error fetching messages', error instanceof Error ? error : new Error(String(error)));
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  // Send Message with AI
  sendMessageWithAI: async (request: SendMessageWithAIRequest) => {
    set({ isSending: true, error: null });

    try {
      // Call backend API - it will save user message + generate AI response
      await chatApiService.sendMessageWithAI(request);

      // Messages will appear via real-time subscription
      set({ isSending: false });
    } catch (error: CatchError) {
      logger.error('Error sending message with AI', error instanceof Error ? error : new Error(String(error)));
      set({ error: getErrorMessage(error), isSending: false });
      throw error;
    }
  },

  // Send Message as Admin (without AI)
  sendMessageAsAdmin: async (conversationId: string, message: string, senderId: string) => {
    set({ isSending: true, error: null });

    try {
      await chatApiService.sendMessage({
        conversationId,
        message,
        senderRole: SenderRole.HumanAgent,
        senderId,
        messageType: MessageType.Text,
      });

      // Message will appear via real-time subscription
      set({ isSending: false });
    } catch (error: CatchError) {
      logger.error('Error sending admin message', error instanceof Error ? error : new Error(String(error)));
      set({ error: getErrorMessage(error), isSending: false });
      throw error;
    }
  },

  // Upload Images and Send Message
  uploadAndSendImages: async (
    conversationId: string,
    message: string,
    agentId: string,
    files: File[]
  ) => {
    set({ isSending: true, error: null });

    try {
      // Generate unique message ID for uploads
      const messageId = uuidv4();

      // Upload all images
      const attachmentsJson = await chatApiService.uploadImages({
        files,
        conversationId,
        messageId,
      });

      // Send message with attachments
      await chatApiService.sendMessageWithAI({
        conversationId,
        message,
        agentId,
        messageType: MessageType.Image,
        attachments: attachmentsJson,
      });

      set({ isSending: false });
    } catch (error: CatchError) {
      logger.error('Error uploading images', error instanceof Error ? error : new Error(String(error)));
      set({ error: getErrorMessage(error), isSending: false });
      throw error;
    }
  },

  // Load More (older messages)
  loadMore: async (conversationId: string) => {
    await get().fetchMessages(conversationId, false);
  },

  // Subscribe to Real-time Updates
  subscribe: (conversationId: string) => {
    const { subscriptionChannel, handleRealtimeEvent } = get();

    // Unsubscribe from existing channel first
    if (subscriptionChannel) {
      unsubscribeChannel(subscriptionChannel);
    }

    // Subscribe to new conversation's messages
    const channel = subscribeToMessages(conversationId, handleRealtimeEvent);
    set({ subscriptionChannel: channel });
  },

  // Unsubscribe
  unsubscribe: () => {
    const { subscriptionChannel } = get();
    if (subscriptionChannel) {
      unsubscribeChannel(subscriptionChannel);
      set({ subscriptionChannel: null });
    }
  },

  // Change Conversation
  changeConversation: (conversationId: string) => {
    get().clearMessages();
    get().fetchMessages(conversationId, true);
  },

  // Clear Messages
  clearMessages: () => {
    get().unsubscribe();
    set({
      messages: [],
      currentConversationId: null,
      isLoading: false,
      isSending: false,
      hasMore: true,
      error: null,
      subscriptionChannel: null,
    });
  },

  // Handle Real-time Events
  handleRealtimeEvent: (payload: ChatMessage[], eventType: RealtimeEventType) => {
    const { messages } = get();

    if (!payload || payload.length === 0) return;

    const message = payload[0];

    switch (eventType) {
      case 'INSERT': {
        // Avoid duplicates
        const exists = messages.some((m) => m.id === message.id);
        if (exists) return;

        // Add to end (newest at bottom)
        set({ messages: [...messages, message] });
        break;
      }

      case 'UPDATE': {
        // Update existing message
        const newMessages = messages.map((m) => (m.id === message.id ? message : m));
        set({ messages: newMessages });
        break;
      }
    }
  },
}));
