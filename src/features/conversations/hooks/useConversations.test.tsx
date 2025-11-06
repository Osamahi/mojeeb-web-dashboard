import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversations } from './useConversations';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import * as conversationService from '../services/conversationService';
import type { Conversation } from '../types';

// Mock the conversation service
vi.mock('../services/conversationService', () => ({
  fetchConversations: vi.fn(),
}));

// Create wrapper with React Query provider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
        gcTime: 0, // Disable cache
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useConversations', () => {
  const mockConversation1: Conversation = {
    id: 'conv-1',
    agentId: 'agent-1',
    customerId: 'customer-1',
    title: 'Test Conversation 1',
    lastMessage: 'Hello',
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
    lastMessage: 'Hi there',
    lastMessageAt: '2025-01-06T15:00:00Z',
    createdAt: '2025-01-02T09:00:00Z',
    updatedAt: '2025-01-06T15:00:00Z',
    status: 'active',
  };

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
  });

  describe('Query Behavior', () => {
    it('should not fetch when no agent is selected', async () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(conversationService.fetchConversations).not.toHaveBeenCalled();
    });

    it('should fetch conversations when agent is selected', async () => {
      const mockFetch = vi
        .mocked(conversationService.fetchConversations)
        .mockResolvedValue([mockConversation1, mockConversation2]);

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

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith({ agentId: 'agent-1' });
      expect(result.current.data).toEqual([mockConversation1, mockConversation2]);
    });

    it('should handle empty conversation list', async () => {
      const mockFetch = vi.mocked(conversationService.fetchConversations).mockResolvedValue([]);

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

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should pass correct agentId to fetch function', async () => {
      const mockFetch = vi
        .mocked(conversationService.fetchConversations)
        .mockResolvedValue([mockConversation1]);

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

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith({ agentId: 'test-agent-123' });
    });
  });

  describe('Query Enabled State', () => {
    it('should be disabled when agentId is undefined', async () => {
      const mockFetch = vi.mocked(conversationService.fetchConversations);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      // Should not fetch
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('should become enabled when agent is selected', async () => {
      const mockFetch = vi
        .mocked(conversationService.fetchConversations)
        .mockResolvedValue([mockConversation1]);

      const { result, rerender } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      // Initially disabled
      expect(mockFetch).not.toHaveBeenCalled();

      // Select agent
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

      rerender();

      // Should now fetch
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should stay disabled when agent is cleared', async () => {
      const mockFetch = vi
        .mocked(conversationService.fetchConversations)
        .mockResolvedValue([mockConversation1]);

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

      const { result, rerender } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear agent
      useAgentStore.setState({ globalSelectedAgent: null });
      rerender();

      // Should not fetch again
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should have correct loading states during fetch', async () => {
      const mockFetch = vi
        .mocked(conversationService.fetchConversations)
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve([mockConversation1]), 100))
        );

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

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual([mockConversation1]);
    });

    it('should indicate loading state immediately when agent is selected', () => {
      vi.mocked(conversationService.fetchConversations).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

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

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Data Structure', () => {
    it('should return data as an array of conversations', async () => {
      vi.mocked(conversationService.fetchConversations).mockResolvedValue([
        mockConversation1,
        mockConversation2,
      ]);

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

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data).toHaveLength(2);
    });

    it('should preserve conversation properties', async () => {
      vi.mocked(conversationService.fetchConversations).mockResolvedValue([mockConversation1]);

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

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const conversation = result.current.data?.[0];
      expect(conversation?.id).toBe('conv-1');
      expect(conversation?.title).toBe('Test Conversation 1');
      expect(conversation?.lastMessage).toBe('Hello');
      expect(conversation?.status).toBe('active');
    });
  });

  describe('React Query Integration', () => {
    it('should use correct query key based on agentId', async () => {
      vi.mocked(conversationService.fetchConversations).mockResolvedValue([mockConversation1]);

      useAgentStore.setState({
        globalSelectedAgent: {
          id: 'agent-xyz',
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'gpt-4',
          createdAt: '2025-01-01',
          userId: 'user-1',
        },
      });

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Query key should be reactive to agentId
      expect(result.current.data).toBeDefined();
    });

    it('should provide React Query states', () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

      // Check that all React Query states are available
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('error');
    });
  });
});
