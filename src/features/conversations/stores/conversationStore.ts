/**
 * Conversation Store - Zustand (UI State Only)
 * Manages conversation UI state (selected conversation)
 * Data fetching and real-time updates handled by React Query hooks
 */

import { create } from 'zustand';
import type { Conversation } from '../types';

interface ConversationStore {
  // UI State
  selectedConversation: Conversation | null;

  // Actions
  selectConversation: (conversation: Conversation | null) => void;
  clearSelection: () => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  // Initial State
  selectedConversation: null,

  // Select Conversation
  selectConversation: (conversation: Conversation | null) => {
    set({ selectedConversation: conversation });
  },

  // Clear Selection
  clearSelection: () => {
    set({ selectedConversation: null });
  },
}));
