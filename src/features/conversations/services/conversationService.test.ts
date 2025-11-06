import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  Conversation,
  ChatMessage,
  ConversationStatus,
  UpdateConversationRequest,
  MessageType,
  SenderRole,
  MessageStatus,
  ConversationSentiment,
} from '../types';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Hoist Supabase mock
const mocks = vi.hoisted(() => {
  // Mock query builder chain
  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    return builder;
  };

  return {
    mockFrom: vi.fn(() => createQueryBuilder()),
    mockChannel: vi.fn(),
    mockRemoveChannel: vi.fn(),
    createQueryBuilder,
  };
});

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mocks.mockFrom,
    channel: mocks.mockChannel,
    removeChannel: mocks.mockRemoveChannel,
  },
}));

// Import after mocks
import {
  fetchConversations,
  fetchMessages,
  subscribeToConversations,
  subscribeToMessages,
  updateConversation,
  markConversationAsRead,
  updateMessage,
  softDeleteMessage,
  toggleAIMode,
  unsubscribeChannel,
} from './conversationService';

describe('conversationService', () => {
  const mockConversation: Conversation = {
    id: 'conv-123',
    customer_id: 'customer-123',
    customer_name: 'Test Customer',
    customer_metadata: { platform: 'web' },
    agent_id: 'agent-123',
    source: 'web',
    status: 1, // Open
    last_message: 'Hello, how can I help?',
    last_message_at: '2025-01-06T12:00:00Z',
    is_ai: true,
    is_active: true,
    created_at: '2025-01-06T10:00:00Z',
    updated_at: '2025-01-06T12:00:00Z',
    topic: 'Support',
    sentiment: 3, // Neutral
    requires_human_attention: false,
    urgent: false,
    am_not_sure_how_to_answer: false,
    analysis_updated_at: '2025-01-06T12:00:00Z',
    platform_conversation_id: null,
    platform_customer_id: null,
    platform_connection_id: null,
  };

  const mockMessage: ChatMessage = {
    id: 'msg-123',
    conversation_id: 'conv-123',
    message: 'Hello, how can I help you?',
    message_type: 1, // Text
    attachments: null,
    sender_id: 'agent-123',
    sender_role: 2, // AI Agent
    status: 1, // Active
    created_at: '2025-01-06T12:00:00Z',
    updated_at: '2025-01-06T12:00:00Z',
    platform_message_id: null,
    action_metadata: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchConversations', () => {
    it('should fetch conversations for agent with default pagination', async () => {
      const builder = mocks.createQueryBuilder();
      builder.range = vi.fn().mockResolvedValue({
        data: [mockConversation],
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      const result = await fetchConversations({ agentId: 'agent-123' });

      expect(mocks.mockFrom).toHaveBeenCalledWith('conversations');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('agent_id', 'agent-123');
      expect(builder.neq).toHaveBeenCalledWith('status', 4); // Exclude deleted
      expect(builder.not).toHaveBeenCalledWith('last_message', 'is', null);
      expect(builder.neq).toHaveBeenCalledWith('last_message', '');
      expect(builder.order).toHaveBeenCalledWith('last_message_at', { ascending: false });
      expect(builder.range).toHaveBeenCalledWith(0, 19); // Default PAGE_SIZE = 20
      expect(result).toEqual([mockConversation]);
    });

    it('should fetch conversations with custom pagination', async () => {
      const builder = mocks.createQueryBuilder();
      builder.range = vi.fn().mockResolvedValue({
        data: [mockConversation],
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      await fetchConversations({
        agentId: 'agent-123',
        offset: 20,
        limit: 10,
      });

      expect(builder.range).toHaveBeenCalledWith(20, 29); // offset to offset + limit - 1
    });

    it('should handle fetch error', async () => {
      const builder = mocks.createQueryBuilder();
      const error = new Error('Database error');
      builder.range = vi.fn().mockResolvedValue({
        data: null,
        error,
      });

      mocks.mockFrom.mockReturnValue(builder);

      await expect(
        fetchConversations({ agentId: 'agent-123' })
      ).rejects.toThrow('Database error');
    });

    it('should return empty array when no conversations', async () => {
      const builder = mocks.createQueryBuilder();
      builder.range = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      const result = await fetchConversations({ agentId: 'agent-123' });

      expect(result).toEqual([]);
    });
  });

  describe('fetchMessages', () => {
    it('should fetch messages and reverse order', async () => {
      const messages = [
        { ...mockMessage, id: 'msg-3', created_at: '2025-01-06T12:02:00Z' },
        { ...mockMessage, id: 'msg-2', created_at: '2025-01-06T12:01:00Z' },
        { ...mockMessage, id: 'msg-1', created_at: '2025-01-06T12:00:00Z' },
      ];

      const builder = mocks.createQueryBuilder();
      builder.range = vi.fn().mockResolvedValue({
        data: messages,
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      const result = await fetchMessages({ conversationId: 'conv-123' });

      expect(mocks.mockFrom).toHaveBeenCalledWith('chats');
      expect(builder.eq).toHaveBeenCalledWith('conversation_id', 'conv-123');
      expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(builder.range).toHaveBeenCalledWith(0, 49); // Default CHAT_PAGE_SIZE = 50

      // Verify messages are reversed (oldest to newest for display)
      expect(result[0].id).toBe('msg-1');
      expect(result[1].id).toBe('msg-2');
      expect(result[2].id).toBe('msg-3');
    });

    it('should handle empty messages', async () => {
      const builder = mocks.createQueryBuilder();
      builder.range = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      const result = await fetchMessages({ conversationId: 'conv-123' });

      expect(result).toEqual([]);
    });

    it('should handle fetch error', async () => {
      const builder = mocks.createQueryBuilder();
      const error = new Error('Database error');
      builder.range = vi.fn().mockResolvedValue({
        data: null,
        error,
      });

      mocks.mockFrom.mockReturnValue(builder);

      await expect(
        fetchMessages({ conversationId: 'conv-123' })
      ).rejects.toThrow('Database error');
    });
  });

  describe('subscribeToConversations', () => {
    it('should create subscription channel with correct config', () => {
      const mockOn = vi.fn().mockReturnThis();
      const mockSubscribe = vi.fn();
      const mockChannel = {
        on: mockOn,
        subscribe: mockSubscribe,
      };

      mocks.mockChannel.mockReturnValue(mockChannel);

      const callback = vi.fn();
      const channel = subscribeToConversations('agent-123', callback);

      expect(mocks.mockChannel).toHaveBeenCalledWith('conversations_agent-123');
      expect(mockOn).toHaveBeenCalledTimes(3); // INSERT, UPDATE, DELETE
      expect(mockSubscribe).toHaveBeenCalledOnce();
      expect(channel).toBe(mockChannel);
    });

    it('should handle INSERT event correctly', () => {
      const mockOn = vi.fn((event, config, handler) => {
        if (config.event === 'INSERT') {
          // Simulate INSERT event
          handler({
            eventType: 'INSERT',
            new: mockConversation,
            old: {},
          });
        }
        return mockChannel;
      });
      const mockSubscribe = vi.fn();
      const mockChannel = { on: mockOn, subscribe: mockSubscribe };

      mocks.mockChannel.mockReturnValue(mockChannel);

      const callback = vi.fn();
      subscribeToConversations('agent-123', callback);

      expect(callback).toHaveBeenCalledWith([mockConversation], 'INSERT');
    });
  });

  describe('subscribeToMessages', () => {
    it('should create subscription channel for messages', () => {
      const mockOn = vi.fn().mockReturnThis();
      const mockSubscribe = vi.fn();
      const mockChannel = {
        on: mockOn,
        subscribe: mockSubscribe,
      };

      mocks.mockChannel.mockReturnValue(mockChannel);

      const callback = vi.fn();
      const channel = subscribeToMessages('conv-123', callback);

      expect(mocks.mockChannel).toHaveBeenCalledWith('chats_conv-123');
      expect(mockOn).toHaveBeenCalledTimes(2); // INSERT, UPDATE (no DELETE for messages)
      expect(mockSubscribe).toHaveBeenCalledOnce();
      expect(channel).toBe(mockChannel);
    });
  });

  describe('updateConversation', () => {
    it('should update conversation with all fields', async () => {
      const builder = mocks.createQueryBuilder();
      builder.single = vi.fn().mockResolvedValue({
        data: { ...mockConversation, status: 2, urgent: true },
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      const updateRequest: UpdateConversationRequest = {
        conversationId: 'conv-123',
        status: 2 as ConversationStatus, // Closed
        requiresHumanAttention: true,
        urgent: true,
        topic: 'Technical Support',
        sentiment: 1 as ConversationSentiment, // Negative
      };

      const result = await updateConversation(updateRequest);

      expect(mocks.mockFrom).toHaveBeenCalledWith('conversations');
      expect(builder.update).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'conv-123');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();
      expect(result.status).toBe(2);
      expect(result.urgent).toBe(true);
    });

    it('should update only specified fields', async () => {
      const builder = mocks.createQueryBuilder();
      builder.single = vi.fn().mockResolvedValue({
        data: mockConversation,
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      await updateConversation({
        conversationId: 'conv-123',
        urgent: true,
      });

      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          urgent: true,
          updated_at: expect.any(String),
        })
      );
    });

    it('should handle update error', async () => {
      const builder = mocks.createQueryBuilder();
      const error = new Error('Update failed');
      builder.single = vi.fn().mockResolvedValue({
        data: null,
        error,
      });

      mocks.mockFrom.mockReturnValue(builder);

      await expect(
        updateConversation({ conversationId: 'conv-123', urgent: true })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('markConversationAsRead', () => {
    it('should update conversation timestamp', async () => {
      const builder = mocks.createQueryBuilder();
      builder.eq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      await markConversationAsRead('conv-123');

      expect(mocks.mockFrom).toHaveBeenCalledWith('conversations');
      expect(builder.update).toHaveBeenCalledWith({
        updated_at: expect.any(String),
      });
      expect(builder.eq).toHaveBeenCalledWith('id', 'conv-123');
    });

    it('should handle mark as read error', async () => {
      const builder = mocks.createQueryBuilder();
      const error = new Error('Update failed');
      builder.eq = vi.fn().mockResolvedValue({
        data: null,
        error,
      });

      mocks.mockFrom.mockReturnValue(builder);

      await expect(
        markConversationAsRead('conv-123')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('updateMessage', () => {
    it('should update message content', async () => {
      const updatedMessage = {
        ...mockMessage,
        message: 'Updated message',
      };

      const builder = mocks.createQueryBuilder();
      builder.single = vi.fn().mockResolvedValue({
        data: updatedMessage,
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      const result = await updateMessage({
        messageId: 'msg-123',
        newMessage: 'Updated message',
      });

      expect(mocks.mockFrom).toHaveBeenCalledWith('chats');
      expect(builder.update).toHaveBeenCalledWith({
        message: 'Updated message',
        updated_at: expect.any(String),
      });
      expect(builder.eq).toHaveBeenCalledWith('id', 'msg-123');
      expect(result.message).toBe('Updated message');
    });

    it('should handle update error', async () => {
      const builder = mocks.createQueryBuilder();
      const error = new Error('Update failed');
      builder.single = vi.fn().mockResolvedValue({
        data: null,
        error,
      });

      mocks.mockFrom.mockReturnValue(builder);

      await expect(
        updateMessage({ messageId: 'msg-123', newMessage: 'Test' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('softDeleteMessage', () => {
    it('should soft delete message by setting status to 0', async () => {
      const builder = mocks.createQueryBuilder();
      builder.eq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      await softDeleteMessage('msg-123');

      expect(mocks.mockFrom).toHaveBeenCalledWith('chats');
      expect(builder.update).toHaveBeenCalledWith({
        status: 0, // MessageStatus.Deleted
        updated_at: expect.any(String),
      });
      expect(builder.eq).toHaveBeenCalledWith('id', 'msg-123');
    });

    it('should handle delete error', async () => {
      const builder = mocks.createQueryBuilder();
      const error = new Error('Delete failed');
      builder.eq = vi.fn().mockResolvedValue({
        data: null,
        error,
      });

      mocks.mockFrom.mockReturnValue(builder);

      await expect(
        softDeleteMessage('msg-123')
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('toggleAIMode', () => {
    it('should enable AI mode', async () => {
      const updatedConv = {
        ...mockConversation,
        is_ai: true,
      };

      const builder = mocks.createQueryBuilder();
      builder.single = vi.fn().mockResolvedValue({
        data: updatedConv,
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      const result = await toggleAIMode('conv-123', true);

      expect(mocks.mockFrom).toHaveBeenCalledWith('conversations');
      expect(builder.update).toHaveBeenCalledWith({
        is_ai: true,
        updated_at: expect.any(String),
      });
      expect(result.is_ai).toBe(true);
    });

    it('should disable AI mode', async () => {
      const updatedConv = {
        ...mockConversation,
        is_ai: false,
      };

      const builder = mocks.createQueryBuilder();
      builder.single = vi.fn().mockResolvedValue({
        data: updatedConv,
        error: null,
      });

      mocks.mockFrom.mockReturnValue(builder);

      const result = await toggleAIMode('conv-123', false);

      expect(builder.update).toHaveBeenCalledWith({
        is_ai: false,
        updated_at: expect.any(String),
      });
      expect(result.is_ai).toBe(false);
    });

    it('should handle toggle error', async () => {
      const builder = mocks.createQueryBuilder();
      const error = new Error('Toggle failed');
      builder.single = vi.fn().mockResolvedValue({
        data: null,
        error,
      });

      mocks.mockFrom.mockReturnValue(builder);

      await expect(
        toggleAIMode('conv-123', true)
      ).rejects.toThrow('Toggle failed');
    });
  });

  describe('unsubscribeChannel', () => {
    it('should remove channel from Supabase', () => {
      const mockChannel = { name: 'test-channel' } as any;

      unsubscribeChannel(mockChannel);

      expect(mocks.mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
    });
  });
});
