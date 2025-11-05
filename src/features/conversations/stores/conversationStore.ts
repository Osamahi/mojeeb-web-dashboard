/**
 * Conversation Store - Zustand
 * Manages conversation list with real-time Supabase subscriptions
 * Follows Flutter MobX store patterns
 */

import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Conversation } from '../types';
import {
  fetchConversations,
  subscribeToConversations,
  unsubscribeChannel,
  type RealtimeEventType,
} from '../services/conversationService';

const PAGE_SIZE = 20;

interface ConversationStore {
  // State
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  currentAgentId: string | null;

  // Real-time
  subscriptionChannel: RealtimeChannel | null;

  // Actions
  fetchConversations: (agentId: string, refresh?: boolean) => Promise<void>;
  selectConversation: (conversation: Conversation | null) => void;
  loadMore: (agentId: string) => Promise<void>;
  subscribe: (agentId: string) => void;
  unsubscribe: () => void;
  clearConversations: () => void;

  // Real-time handlers
  handleRealtimeEvent: (payload: Conversation[], eventType: RealtimeEventType) => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  // Initial State
  conversations: [],
  selectedConversation: null,
  isLoading: false,
  hasMore: true,
  error: null,
  currentAgentId: null,
  subscriptionChannel: null,

  // Fetch Conversations
  fetchConversations: async (agentId: string, refresh = false) => {
    const { conversations, isLoading, hasMore, currentAgentId } = get();

    // Don't fetch if already loading or no more data (unless refreshing)
    if (isLoading || (!refresh && !hasMore && currentAgentId === agentId)) {
      return;
    }

    // If agent changed, reset everything
    if (agentId !== currentAgentId) {
      set({
        conversations: [],
        selectedConversation: null,
        hasMore: true,
        currentAgentId: agentId,
      });

      // Resubscribe to new agent
      get().unsubscribe();
      get().subscribe(agentId);
    }

    set({ isLoading: true, error: null });

    try {
      const offset = refresh ? 0 : conversations.length;
      const data = await fetchConversations({ agentId, offset, limit: PAGE_SIZE });

      set({
        conversations: refresh ? data : [...conversations, ...data],
        hasMore: data.length === PAGE_SIZE,
        isLoading: false,
        currentAgentId: agentId,
      });
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Select Conversation
  selectConversation: (conversation: Conversation | null) => {
    set({ selectedConversation: conversation });
  },

  // Load More
  loadMore: async (agentId: string) => {
    await get().fetchConversations(agentId, false);
  },

  // Subscribe to Real-time Updates
  subscribe: (agentId: string) => {
    const { subscriptionChannel, handleRealtimeEvent } = get();

    // Unsubscribe from existing channel first
    if (subscriptionChannel) {
      unsubscribeChannel(subscriptionChannel);
    }

    // Subscribe to new agent's conversations
    const channel = subscribeToConversations(agentId, handleRealtimeEvent);
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

  // Clear Conversations
  clearConversations: () => {
    get().unsubscribe();
    set({
      conversations: [],
      selectedConversation: null,
      isLoading: false,
      hasMore: true,
      error: null,
      currentAgentId: null,
      subscriptionChannel: null,
    });
  },

  // Handle Real-time Events
  handleRealtimeEvent: (payload: Conversation[], eventType: RealtimeEventType) => {
    const { conversations, selectedConversation } = get();

    if (!payload || payload.length === 0) return;

    const conversation = payload[0];

    switch (eventType) {
      case 'INSERT':
        // Add new conversation to top
        set({ conversations: [conversation, ...conversations] });
        break;

      case 'UPDATE': {
        const index = conversations.findIndex((c) => c.id === conversation.id);

        if (index === -1) {
          // Not found, add to top
          set({ conversations: [conversation, ...conversations] });
          return;
        }

        const oldConv = conversations[index];

        // Check if there's a new message
        const hasNewMessage =
          conversation.last_message_at &&
          (!oldConv.last_message_at ||
            new Date(conversation.last_message_at) > new Date(oldConv.last_message_at));

        // Preserve customer_metadata from old conversation (real-time often doesn't include it)
        const updatedConv: Conversation = {
          ...conversation,
          customer_metadata: conversation.customer_metadata || oldConv.customer_metadata,
        };

        // Update in place
        const newList = [...conversations];
        newList[index] = updatedConv;

        // Move to top if new message and not already at top
        if (hasNewMessage && index !== 0) {
          newList.splice(index, 1);
          newList.unshift(updatedConv);
        }

        // Sort by last_message_at
        newList.sort((a, b) => {
          const aTime = a.last_message_at || a.created_at;
          const bTime = b.last_message_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        // Update selected conversation if it was updated
        const updatedSelected =
          selectedConversation?.id === conversation.id ? updatedConv : selectedConversation;

        set({ conversations: newList, selectedConversation: updatedSelected });
        break;
      }

      case 'DELETE':
        // Remove from list
        const filtered = conversations.filter((c) => c.id !== conversation.id);

        // Clear selection if deleted conversation was selected
        const clearedSelected =
          selectedConversation?.id === conversation.id ? null : selectedConversation;

        set({ conversations: filtered, selectedConversation: clearedSelected });
        break;
    }
  },
}));
