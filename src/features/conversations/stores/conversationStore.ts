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
  /**
   * Merge a partial server payload onto the currently selected conversation.
   * No-op when the selected conversation differs from the incoming id.
   * Used by the realtime subscription to keep ChatPanel in sync with DB updates
   * (e.g. ai_handoff_until set/cleared, is_ai toggled remotely).
   */
  patchSelectedConversation: (id: string, patch: Partial<Conversation>) => void;
  clearSelection: () => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  // Initial State
  selectedConversation: null,

  // Select Conversation
  selectConversation: (conversation: Conversation | null) => {
    set({ selectedConversation: conversation });
  },

  patchSelectedConversation: (id, patch) => {
    set((state) =>
      state.selectedConversation && state.selectedConversation.id === id
        ? { selectedConversation: { ...state.selectedConversation, ...patch } }
        : state
    );
  },

  // Clear Selection
  clearSelection: () => {
    set({ selectedConversation: null });
  },
}));
