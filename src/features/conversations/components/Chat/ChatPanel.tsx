/**
 * Chat Panel Component
 * WhatsApp-style chat interface with messages and composer
 * Real-time updates with auto-scroll
 */

import { useEffect, useRef, UIEvent, useCallback } from 'react';
import { ArrowLeft, Bot, User } from 'lucide-react';
import type { Conversation } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import ChatMessageBubble from './ChatMessageBubble';
import MessageComposer from './MessageComposer';
import { ChatMessagesSkeleton } from '../shared/LoadingSkeleton';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  conversation: Conversation;
  onBack?: () => void;
}

export default function ChatPanel({ conversation, onBack }: ChatPanelProps) {
  const globalSelectedAgent = useAgentStore((state) => state.globalSelectedAgent);
  const {
    messages,
    isLoading,
    isSending,
    hasMore,
    fetchMessages,
    sendMessageWithAI,
    subscribe,
    unsubscribe,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef(0);

  // Fetch messages and subscribe on conversation change
  useEffect(() => {
    if (!conversation.id) return;

    // Fetch messages
    fetchMessages(conversation.id, true);

    // Subscribe to real-time updates
    subscribe(conversation.id);

    return () => {
      // Unsubscribe on unmount
      unsubscribe();
    };
  }, [conversation.id, fetchMessages, subscribe, unsubscribe]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages.length]);

  // Handle scroll for infinite loading (load older messages)
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrolledToTop = element.scrollTop < 100;

    if (scrolledToTop && hasMore && !isLoading) {
      // Save current scroll position
      previousScrollHeight.current = element.scrollHeight;

      // Load more messages
      fetchMessages(conversation.id, false).then(() => {
        // Restore scroll position after loading
        if (messagesContainerRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight.current;
        }
      });
    }
  };

  // Handle send message
  const handleSendMessage = useCallback(async (message: string) => {
    if (!globalSelectedAgent) return;

    await sendMessageWithAI({
      conversationId: conversation.id,
      message,
      agentId: globalSelectedAgent.id,
    });
  }, [conversation.id, globalSelectedAgent, sendMessageWithAI]);

  // Extract profile picture
  const profilePictureUrl = conversation.customer_metadata?.profile_picture;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 p-4 flex items-center gap-3 flex-shrink-0">
        {/* Back button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Customer Avatar */}
        <Avatar
          src={profilePictureUrl}
          name={conversation.customer_name}
          size="md"
        />

        {/* Customer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-950 truncate">
              {conversation.customer_name}
            </h3>

            {/* AI/Human Mode Indicator */}
            {conversation.is_ai ? (
              <Badge variant="primary" className="text-xs gap-1">
                <Bot className="w-3 h-3" />
                AI Mode
              </Badge>
            ) : (
              <Badge variant="warning" className="text-xs gap-1">
                <User className="w-3 h-3" />
                Human Mode
              </Badge>
            )}
          </div>

          {/* Topic or source */}
          {conversation.topic && (
            <p className="text-xs text-neutral-600 truncate">
              Topic: {conversation.topic}
            </p>
          )}
        </div>

        {/* Source badge */}
        {conversation.source !== 'web' && (
          <Badge variant="default" className="text-xs">
            {conversation.source}
          </Badge>
        )}
      </div>

      {/* Messages List */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6"
        onScroll={handleScroll}
      >
        {/* Loading more indicator */}
        {isLoading && messages.length > 0 && (
          <div className="text-center py-4 text-sm text-neutral-500">
            Loading older messages...
          </div>
        )}

        {/* No more messages */}
        {!hasMore && messages.length > 0 && (
          <div className="text-center py-4 text-sm text-neutral-500">
            Beginning of conversation
          </div>
        )}

        {/* Initial loading */}
        {isLoading && messages.length === 0 ? (
          <ChatMessagesSkeleton />
        ) : (
          <>
            {/* Messages */}
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        isSending={isSending}
        isAIMode={conversation.is_ai}
        placeholder={
          conversation.is_ai
            ? 'Type a message... (AI will respond)'
            : 'Type a message... (You are responding)'
        }
      />
    </div>
  );
}
