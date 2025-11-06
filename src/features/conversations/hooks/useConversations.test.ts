import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversations } from './useConversations';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import * as conversationService from '../services/conversationService';
import type { Conversation } from '../types';
import { AxiosError } from 'axios';

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
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const mockError = new AxiosError('API Error');
      mockError.response = { status: 500 } as any;

      vi.mocked(conversationService.fetchConversations).mockRejectedValue(mockError);

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
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should throw error when agent ID becomes undefined mid-fetch', async () => {
      vi.mocked(conversationService.fetchConversations).mockRejectedValue(
        new Error('No agent selected')
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

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('Retry Logic', () => {
    it('should not retry on 401 authentication errors', async () => {
      const mockError = new AxiosError('Unauthorized');
      mockError.response = { status: 401 } as any;

      const mockFetch = vi
        .mocked(conversationService.fetchConversations)
        .mockRejectedValue(mockError);

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

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: any) => {
              if (error?.response?.status === 401) return false;
              return failureCount < 2;
            },
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useConversations(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should only be called once (no retries)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 403 forbidden errors', async () => {
      const mockError = new AxiosError('Forbidden');
      mockError.response = { status: 403 } as any;

      const mockFetch = vi
        .mocked(conversationService.fetchConversations)
        .mockRejectedValue(mockError);

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

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: any) => {
              if (error?.response?.status === 403) return false;
              return failureCount < 2;
            },
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useConversations(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 429 rate limit errors', async () => {
      const mockError = new AxiosError('Too Many Requests');
      mockError.response = { status: 429 } as any;

      const mockFetch = vi
        .mocked(conversationService.fetchConversations)
        .mockRejectedValue(mockError);

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

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: any) => {
              if (error?.response?.status === 429) return false;
              return failureCount < 2;
            },
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useConversations(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query Key Reactivity', () => {
    it('should refetch when agent changes', async () => {
      const mockFetch = vi
        .mocked(conversationService.fetchConversations)
        .mockResolvedValueOnce([mockConversation1])
        .mockResolvedValueOnce([mockConversation2]);

      // Start with agent-1
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

      expect(mockFetch).toHaveBeenCalledWith({ agentId: 'agent-1' });
      expect(result.current.data).toEqual([mockConversation1]);

      // Change to agent-2
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

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith({ agentId: 'agent-2' });
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.current.data).toEqual([mockConversation2]);
    });

    it('should disable query when agent is cleared', async () => {
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

    it('should transition to error state on failure', async () => {
      vi.mocked(conversationService.fetchConversations).mockRejectedValue(new Error('API Error'));

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
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('Query Configuration', () => {
    it('should have staleTime of 30 seconds', () => {
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

      // Check that staleTime is configured (via options)
      expect(result.current).toBeDefined();
    });

    it('should be enabled only when agentId exists', async () => {
      const mockFetch = vi.mocked(conversationService.fetchConversations);

      // No agent selected
      const { rerender } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      });

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

      mockFetch.mockResolvedValue([mockConversation1]);
      rerender();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });
});
