/**
 * Conversation Service - Direct Supabase Queries
 * Following Flutter implementation pattern for read/write operations
 * Real-time subscriptions for live updates
 */

import { supabase } from '@/lib/supabase';
import type {
  Conversation,
  ChatMessage,
  ConversationStatus,
  UpdateConversationRequest,
} from '../types';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { channelRegistry } from '@/lib/supabaseChannelRegistry';

const PAGE_SIZE = 20;
const CHAT_PAGE_SIZE = 50;

// === Fetch Conversations ===

export interface FetchConversationsParams {
  agentId: string;
  offset?: number;
  limit?: number;
}

export const fetchConversations = async ({
  agentId,
  offset = 0,
  limit = PAGE_SIZE,
}: FetchConversationsParams): Promise<Conversation[]> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('agent_id', agentId)
    .neq('status', 4) // Exclude deleted
    .not('last_message', 'is', null)
    .neq('last_message', '')
    .order('last_message_at', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Error fetching conversations', error);
    throw error;
  }

  return data as Conversation[];
};

// === Fetch Single Conversation by ID ===

export const fetchConversationById = async (conversationId: string): Promise<Conversation> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    logger.error('Error fetching conversation by ID', error);
    throw error;
  }

  return data as Conversation;
};

// === Fetch Messages ===

export interface FetchMessagesParams {
  conversationId: string;
  offset?: number;
  limit?: number;
}

export const fetchMessages = async ({
  conversationId,
  offset = 0,
  limit = CHAT_PAGE_SIZE,
}: FetchMessagesParams): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false }) // Fetch newest first
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Error fetching messages', error);
    throw error;
  }

  // IMPORTANT: Reverse for chronological display (oldest to newest)
  return (data as ChatMessage[]).reverse();
};

// === Real-time Subscriptions ===

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export type ConversationRealtimeCallback = (
  payload: Conversation[],
  eventType: RealtimeEventType
) => void;

export const subscribeToConversations = (
  agentId: string,
  callback: ConversationRealtimeCallback
): RealtimeChannel => {
  const channel = supabase.channel(`conversations_${agentId}`);

  const handleChange = (payload: RealtimePostgresChangesPayload<Conversation>) => {
    if (payload.eventType === 'INSERT') {
      callback([payload.new], 'INSERT');
    } else if (payload.eventType === 'UPDATE') {
      callback([payload.new], 'UPDATE');
    } else if (payload.eventType === 'DELETE') {
      callback([payload.old], 'DELETE');
    }
  };

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `agent_id=eq.${agentId}`,
      },
      handleChange
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `agent_id=eq.${agentId}`,
      },
      handleChange
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'conversations',
        filter: `agent_id=eq.${agentId}`,
      },
      handleChange
    )
    .subscribe();

  // Register channel for cleanup on logout
  channelRegistry.register(channel, `conversations-${agentId}`);

  return channel;
};

export type MessageRealtimeCallback = (
  payload: ChatMessage[],
  eventType: RealtimeEventType
) => void;

export const subscribeToMessages = (
  conversationId: string,
  callback: MessageRealtimeCallback
): RealtimeChannel => {
  const channel = supabase.channel(`chats_${conversationId}`);

  const handleChange = (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
    if (payload.eventType === 'INSERT') {
      callback([payload.new], 'INSERT');
    } else if (payload.eventType === 'UPDATE') {
      callback([payload.new], 'UPDATE');
    }
  };

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chats',
        filter: `conversation_id=eq.${conversationId}`,
      },
      handleChange
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chats',
        filter: `conversation_id=eq.${conversationId}`,
      },
      handleChange
    )
    .subscribe();

  // Register channel for cleanup on logout
  channelRegistry.register(channel, `chats-${conversationId}`);

  return channel;
};

// === Update Conversation ===

export const updateConversation = async ({
  conversationId,
  status,
  requiresHumanAttention,
  urgent,
  topic,
  sentiment,
}: UpdateConversationRequest): Promise<Conversation> => {
  const updateData: Partial<Conversation> = {
    updated_at: new Date().toISOString(),
  };

  if (status !== undefined) updateData.status = status;
  if (requiresHumanAttention !== undefined)
    updateData.requires_human_attention = requiresHumanAttention;
  if (urgent !== undefined) updateData.urgent = urgent;
  if (topic !== undefined) updateData.topic = topic;
  if (sentiment !== undefined) updateData.sentiment = sentiment;

  const { data, error } = await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', conversationId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating conversation', error);
    throw error;
  }

  return data as Conversation;
};

// === Mark Conversation as Read ===

export const markConversationAsRead = async (conversationId: string): Promise<void> => {
  const { error } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    logger.error('Error marking conversation as read', error);
    throw error;
  }
};

// === Update Message ===

export interface UpdateMessageParams {
  messageId: string;
  newMessage: string;
}

export const updateMessage = async ({
  messageId,
  newMessage,
}: UpdateMessageParams): Promise<ChatMessage> => {
  const { data, error } = await supabase
    .from('chats')
    .update({
      message: newMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating message', error);
    throw error;
  }

  return data as ChatMessage;
};

// === Soft Delete Message ===

export const softDeleteMessage = async (messageId: string): Promise<void> => {
  const { error} = await supabase
    .from('chats')
    .update({
      status: 0, // MessageStatus.Deleted
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId);

  if (error) {
    logger.error('Error deleting message', error);
    throw error;
  }
};

// === Toggle AI Mode ===

export const toggleAIMode = async (
  conversationId: string,
  isAI: boolean
): Promise<Conversation> => {
  const { data, error } = await supabase
    .from('conversations')
    .update({
      is_ai: isAI,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .select()
    .single();

  if (error) {
    logger.error('Error toggling AI mode', error);
    throw error;
  }

  return data as Conversation;
};

// === Unsubscribe Channel ===

export const unsubscribeChannel = (channel: RealtimeChannel): void => {
  channelRegistry.unregister(channel);
  supabase.removeChannel(channel);
};
