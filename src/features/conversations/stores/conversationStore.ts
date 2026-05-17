/**
 * Conversation Store - Zustand (Selection Only)
 *
 * Holds only the ID of the currently-selected conversation. Conversation data
 * (any field on the row) is fetched and kept fresh by React Query — see
 * `useConversation(id)` and `useSelectedConversation()` in features/conversations/hooks.
 *
 * Rationale: keeping a snapshot here caused stale state when realtime updates
 * landed on jsonb columns (e.g. `triggered_actions`). The single source of truth
 * is the React Query cache; this store carries only the UI intent ("which row is
 * the user looking at?").
 */
import { create } from 'zustand';

interface ConversationStore {
  selectedConversationId: string | null;
  selectConversationId: (id: string | null) => void;
  clearSelection: () => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  selectedConversationId: null,
  selectConversationId: (id) => set({ selectedConversationId: id }),
  clearSelection: () => set({ selectedConversationId: null }),
}));
