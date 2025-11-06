import { describe, it, expect, beforeEach } from 'vitest';
import { useConversationStore } from './conversationStore';
import type { Conversation } from '../types';

describe('conversationStore', () => {
  const mockConversation1: Conversation = {
    id: 'conv-1',
    agentId: 'agent-1',
    customerId: 'customer-1',
    title: 'Test Conversation 1',
    lastMessage: 'Hello there',
    lastMessageAt: '2025-01-05T10:00:00Z',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-05T10:00:00Z',
    status: 'active',
  };

  const mockConversation2: Conversation = {
    id: 'conv-2',
    agentId: 'agent-1',
    customerId: 'customer-2',
    title: 'Test Conversation 2',
    lastMessage: 'How can I help?',
    lastMessageAt: '2025-01-06T15:00:00Z',
    createdAt: '2025-01-02T09:00:00Z',
    updatedAt: '2025-01-06T15:00:00Z',
    status: 'active',
  };

  beforeEach(() => {
    // Reset store to initial state
    useConversationStore.setState({
      selectedConversation: null,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useConversationStore.getState();

      expect(state.selectedConversation).toBeNull();
    });

    it('should have selectConversation action defined', () => {
      const state = useConversationStore.getState();

      expect(state.selectConversation).toBeDefined();
      expect(typeof state.selectConversation).toBe('function');
    });

    it('should have clearSelection action defined', () => {
      const state = useConversationStore.getState();

      expect(state.clearSelection).toBeDefined();
      expect(typeof state.clearSelection).toBe('function');
    });
  });

  describe('selectConversation', () => {
    it('should set selected conversation', () => {
      const { selectConversation } = useConversationStore.getState();

      selectConversation(mockConversation1);

      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation1);
    });

    it('should update selected conversation when called multiple times', () => {
      const { selectConversation } = useConversationStore.getState();

      selectConversation(mockConversation1);
      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation1);

      selectConversation(mockConversation2);
      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation2);
    });

    it('should allow selecting null explicitly', () => {
      const { selectConversation } = useConversationStore.getState();

      selectConversation(mockConversation1);
      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation1);

      selectConversation(null);
      expect(useConversationStore.getState().selectedConversation).toBeNull();
    });

    it('should replace previous conversation completely', () => {
      const { selectConversation } = useConversationStore.getState();

      selectConversation(mockConversation1);
      selectConversation(mockConversation2);

      const state = useConversationStore.getState();
      expect(state.selectedConversation?.id).toBe('conv-2');
      expect(state.selectedConversation?.title).toBe('Test Conversation 2');
    });

    it('should handle conversation objects with all properties', () => {
      const { selectConversation } = useConversationStore.getState();

      selectConversation(mockConversation1);

      const selected = useConversationStore.getState().selectedConversation;
      expect(selected).toEqual(mockConversation1);
      expect(selected?.id).toBe('conv-1');
      expect(selected?.agentId).toBe('agent-1');
      expect(selected?.customerId).toBe('customer-1');
      expect(selected?.title).toBe('Test Conversation 1');
      expect(selected?.lastMessage).toBe('Hello there');
      expect(selected?.status).toBe('active');
    });
  });

  describe('clearSelection', () => {
    it('should clear selected conversation', () => {
      const { selectConversation, clearSelection } = useConversationStore.getState();

      selectConversation(mockConversation1);
      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation1);

      clearSelection();
      expect(useConversationStore.getState().selectedConversation).toBeNull();
    });

    it('should work when no conversation is selected', () => {
      const { clearSelection } = useConversationStore.getState();

      expect(useConversationStore.getState().selectedConversation).toBeNull();

      clearSelection();
      expect(useConversationStore.getState().selectedConversation).toBeNull();
    });

    it('should be idempotent when called multiple times', () => {
      const { selectConversation, clearSelection } = useConversationStore.getState();

      selectConversation(mockConversation1);
      clearSelection();
      clearSelection();
      clearSelection();

      expect(useConversationStore.getState().selectedConversation).toBeNull();
    });
  });

  describe('State Transitions', () => {
    it('should handle select -> clear -> select flow', () => {
      const { selectConversation, clearSelection } = useConversationStore.getState();

      // Select first conversation
      selectConversation(mockConversation1);
      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation1);

      // Clear selection
      clearSelection();
      expect(useConversationStore.getState().selectedConversation).toBeNull();

      // Select second conversation
      selectConversation(mockConversation2);
      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation2);
    });

    it('should handle rapid selections', () => {
      const { selectConversation } = useConversationStore.getState();

      selectConversation(mockConversation1);
      selectConversation(mockConversation2);
      selectConversation(mockConversation1);
      selectConversation(mockConversation2);

      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation2);
    });

    it('should handle select -> select null -> select flow', () => {
      const { selectConversation } = useConversationStore.getState();

      selectConversation(mockConversation1);
      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation1);

      selectConversation(null);
      expect(useConversationStore.getState().selectedConversation).toBeNull();

      selectConversation(mockConversation2);
      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation2);
    });

    it('should maintain state independence across actions', () => {
      const { selectConversation, clearSelection } = useConversationStore.getState();

      selectConversation(mockConversation1);
      const firstSelection = useConversationStore.getState().selectedConversation;

      clearSelection();
      const clearedSelection = useConversationStore.getState().selectedConversation;

      selectConversation(mockConversation2);
      const secondSelection = useConversationStore.getState().selectedConversation;

      expect(firstSelection).toEqual(mockConversation1);
      expect(clearedSelection).toBeNull();
      expect(secondSelection).toEqual(mockConversation2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle selecting same conversation twice', () => {
      const { selectConversation } = useConversationStore.getState();

      selectConversation(mockConversation1);
      selectConversation(mockConversation1);

      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation1);
    });

    it('should handle conversation with minimal properties', () => {
      const { selectConversation } = useConversationStore.getState();
      const minimalConversation: Conversation = {
        id: 'min-1',
        agentId: 'agent-1',
        customerId: 'customer-1',
        title: 'Minimal',
        lastMessage: 'Test',
        lastMessageAt: '2025-01-01T10:00:00Z',
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
        status: 'active',
      };

      selectConversation(minimalConversation);

      expect(useConversationStore.getState().selectedConversation).toEqual(minimalConversation);
    });

    it('should preserve conversation object reference when not mutated', () => {
      const { selectConversation } = useConversationStore.getState();

      selectConversation(mockConversation1);
      const firstReference = useConversationStore.getState().selectedConversation;

      // Selecting the same object
      selectConversation(mockConversation1);
      const secondReference = useConversationStore.getState().selectedConversation;

      expect(firstReference).toBe(secondReference);
    });
  });

  describe('Store Selector Patterns', () => {
    it('should allow selecting specific state values', () => {
      const { selectConversation } = useConversationStore.getState();

      selectConversation(mockConversation1);

      const selectedConversation = useConversationStore.getState().selectedConversation;
      expect(selectedConversation?.id).toBe('conv-1');
      expect(selectedConversation?.title).toBe('Test Conversation 1');
    });

    it('should reflect state changes immediately', () => {
      const { selectConversation, clearSelection } = useConversationStore.getState();

      expect(useConversationStore.getState().selectedConversation).toBeNull();

      selectConversation(mockConversation1);
      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation1);

      clearSelection();
      expect(useConversationStore.getState().selectedConversation).toBeNull();
    });

    it('should support accessing nested conversation properties', () => {
      const { selectConversation } = useConversationStore.getState();

      selectConversation(mockConversation1);

      const state = useConversationStore.getState();
      expect(state.selectedConversation?.id).toBe('conv-1');
      expect(state.selectedConversation?.agentId).toBe('agent-1');
      expect(state.selectedConversation?.customerId).toBe('customer-1');
      expect(state.selectedConversation?.lastMessage).toBe('Hello there');
      expect(state.selectedConversation?.status).toBe('active');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle conversation list navigation pattern', () => {
      const { selectConversation } = useConversationStore.getState();

      // User clicks first conversation
      selectConversation(mockConversation1);
      expect(useConversationStore.getState().selectedConversation?.id).toBe('conv-1');

      // User clicks second conversation
      selectConversation(mockConversation2);
      expect(useConversationStore.getState().selectedConversation?.id).toBe('conv-2');

      // User clicks first conversation again
      selectConversation(mockConversation1);
      expect(useConversationStore.getState().selectedConversation?.id).toBe('conv-1');
    });

    it('should handle back navigation pattern', () => {
      const { selectConversation, clearSelection } = useConversationStore.getState();

      // Open conversation
      selectConversation(mockConversation1);
      expect(useConversationStore.getState().selectedConversation).not.toBeNull();

      // Back to list (clear selection)
      clearSelection();
      expect(useConversationStore.getState().selectedConversation).toBeNull();
    });

    it('should handle agent switch clearing conversation', () => {
      const { selectConversation, clearSelection } = useConversationStore.getState();

      // User has conversation selected
      selectConversation(mockConversation1);
      expect(useConversationStore.getState().selectedConversation).toEqual(mockConversation1);

      // User switches agent (should clear selection)
      clearSelection();
      expect(useConversationStore.getState().selectedConversation).toBeNull();
    });

    it('should handle conversation deletion pattern', () => {
      const { selectConversation, clearSelection } = useConversationStore.getState();

      // User has conversation selected
      selectConversation(mockConversation1);
      expect(useConversationStore.getState().selectedConversation).not.toBeNull();

      // Conversation is deleted (clear selection)
      clearSelection();
      expect(useConversationStore.getState().selectedConversation).toBeNull();
    });
  });
});
