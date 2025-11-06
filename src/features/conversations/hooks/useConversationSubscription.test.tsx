import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversationSubscription } from './useConversationSubscription';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import * as conversationService from '../services/conversationService';
import type { Conversation } from '../types';

// Mock the conversation service
const mockSubscribeToConversations = vi.fn();
const mockUnsubscribeChannel = vi.fn();

vi.mock('../services/conversationService', () => ({
  subscribeToConversations: (...args: any[]) => mockSubscribeToConversations(...args),
  unsubscribeChannel: (...args: any[]) => mockUnsubscribeChannel(...args),
}));

// Create wrapper with React Query provider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useConversationSubscription', () => {
  const mockChannel = { unsubscribe: vi.fn() };

  beforeEach(() => {
    // Reset agent store
    useAgentStore.setState({
      agents: [],
      selectedAgent: null,
      globalSelectedAgent: null,
      knowledgeBases: [],
      isLoading: false,
      isAgentSwitching: false,
      error: null,
    });

    // Clear all mocks
    vi.clearAllMocks();
    mockSubscribeToConversations.mockReturnValue(mockChannel);
  });

  describe('Subscription Lifecycle', () => {
    it('should not subscribe when no agent is selected', () => {
      renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      expect(mockSubscribeToConversations).not.toHaveBeenCalled();
    });

    it('should subscribe when agent is selected', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      expect(mockSubscribeToConversations).toHaveBeenCalledWith('agent-1', expect.any(Function));
    });

    it('should pass correct agentId to subscription', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'test-agent-123',
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      expect(mockSubscribeToConversations).toHaveBeenCalledWith(
        'test-agent-123',
        expect.any(Function)
      );
    });

    it('should unsubscribe on unmount', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      const { unmount } = renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      expect(mockSubscribeToConversations).toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('should unsubscribe and resubscribe when agent changes', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Agent 1',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      const { rerender } = renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      expect(mockSubscribeToConversations).toHaveBeenCalledWith('agent-1', expect.any(Function));

      // Change agent
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-2',
          name: 'Agent 2',
          systemPrompt: 'Test',
          model: 'gpt-3.5',
          createdAt: '2025-01-02',
          userId: 'user-1',
        },
      });

      rerender();

      expect(mockUnsubscribeChannel).toHaveBeenCalled();
      expect(mockSubscribeToConversations).toHaveBeenCalledWith('agent-2', expect.any(Function));
    });

    it('should unsubscribe when agent is cleared', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Agent 1',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      const { rerender } = renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      expect(mockSubscribeToConversations).toHaveBeenCalled();

      // Clear agent
      useAgentStore.setState({ globalSelectedAgent: null });
      rerender();

      expect(mockUnsubscribeChannel).toHaveBeenCalled();
    });
  });

  describe('Real-time Event Handling', () => {
    it('should provide callback function to subscription', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      expect(mockSubscribeToConversations).toHaveBeenCalledWith('agent-1', expect.any(Function));

      const callback = mockSubscribeToConversations.mock.calls[0][1];
      expect(typeof callback).toBe('function');
    });

    it('should handle INSERT event callback', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      const callback = mockSubscribeToConversations.mock.calls[0][1];

      const mockConversation: Conversation = {
        id: 'conv-1',
        agentId: 'agent-1',
        customerId: 'customer-1',
        title: 'New Conversation',
        lastMessage: 'Hello',
        lastMessageAt: '2025-01-05T10:00:00Z',
        createdAt: '2025-01-05T10:00:00Z',
        updatedAt: '2025-01-05T10:00:00Z',
        status: 'active',
      };

      // Call callback with INSERT event
      expect(() => callback([mockConversation], 'INSERT')).not.toThrow();
    });

    it('should handle UPDATE event callback', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      const callback = mockSubscribeToConversations.mock.calls[0][1];

      const mockConversation: Conversation = {
        id: 'conv-1',
        agentId: 'agent-1',
        customerId: 'customer-1',
        title: 'Updated Conversation',
        lastMessage: 'Updated message',
        lastMessageAt: '2025-01-05T11:00:00Z',
        createdAt: '2025-01-05T10:00:00Z',
        updatedAt: '2025-01-05T11:00:00Z',
        status: 'active',
      };

      // Call callback with UPDATE event
      expect(() => callback([mockConversation], 'UPDATE')).not.toThrow();
    });

    it('should handle DELETE event callback', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      const callback = mockSubscribeToConversations.mock.calls[0][1];

      const mockConversation: Conversation = {
        id: 'conv-1',
        agentId: 'agent-1',
        customerId: 'customer-1',
        title: 'Deleted Conversation',
        lastMessage: 'Last message',
        lastMessageAt: '2025-01-05T10:00:00Z',
        createdAt: '2025-01-05T10:00:00Z',
        updatedAt: '2025-01-05T10:00:00Z',
        status: 'active',
      };

      // Call callback with DELETE event
      expect(() => callback([mockConversation], 'DELETE')).not.toThrow();
    });

    it('should handle empty payload gracefully', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      const callback = mockSubscribeToConversations.mock.calls[0][1];

      // Call callback with empty payload
      expect(() => callback([], 'INSERT')).not.toThrow();
      expect(() => callback([], 'UPDATE')).not.toThrow();
      expect(() => callback([], 'DELETE')).not.toThrow();
    });
  });

  describe('Cleanup Behavior', () => {
    it('should cleanup on unmount even if never subscribed', () => {
      const { unmount } = renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      unmount();

      // Should not throw or call unsubscribe
      expect(mockUnsubscribeChannel).not.toHaveBeenCalled();
    });

    it('should cleanup properly when remounting', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      const { unmount: unmount1 } = renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      expect(mockSubscribeToConversations).toHaveBeenCalledTimes(1);

      unmount1();
      expect(mockUnsubscribeChannel).toHaveBeenCalledTimes(1);

      // Remount
      const { unmount: unmount2 } = renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      expect(mockSubscribeToConversations).toHaveBeenCalledTimes(2);

      unmount2();
      expect(mockUnsubscribeChannel).toHaveBeenCalledTimes(2);
    });
  });

  describe('Effect Dependencies', () => {
    it('should not resubscribe if agentId stays the same', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      const { rerender } = renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      expect(mockSubscribeToConversations).toHaveBeenCalledTimes(1);

      // Rerender without changing agent
      rerender();

      // Should not resubscribe
      expect(mockSubscribeToConversations).toHaveBeenCalledTimes(1);
      expect(mockUnsubscribeChannel).not.toHaveBeenCalled();
    });

    it('should handle rapid agent switches', () => {
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-1',
          name: 'Agent 1',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      const { rerender } = renderHook(() => useConversationSubscription(), {
        wrapper: createWrapper(),
      });

      // Switch to agent-2
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-2',
          name: 'Agent 2',
          systemPrompt: 'Test',
          model: 'gpt-3.5',
          createdAt: '2025-01-02',
          userId: 'user-1',
        },
      });
      rerender();

      // Switch to agent-3
      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-3',
          name: 'Agent 3',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-03',
          userId: 'user-1',
        },
      });
      rerender();

      // Should have unsubscribed twice and subscribed three times total
      expect(mockUnsubscribeChannel).toHaveBeenCalledTimes(2);
      expect(mockSubscribeToConversations).toHaveBeenCalledTimes(3);
    });
  });
});
