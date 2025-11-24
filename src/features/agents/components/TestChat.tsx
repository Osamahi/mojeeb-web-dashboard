/**
 * Test Chat Component
 * Real-time chat interface for testing agent prompts
 * Replicates Flutter's studio chat with production endpoints and Supabase real-time
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
  testChatService,
  type StudioConversation,
  type MessageResponse,
} from '../services/testChatService';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Types
interface TestMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface TestChatProps {
  agentId: string;
}

// Constants
const AI_RESPONSE_TIMEOUT = 30000;
const SENDER_ROLE = {
  CUSTOMER: 1,
  AI_AGENT: 2,
} as const;

// Helpers
const transformMessage = (backendMsg: MessageResponse): TestMessage => ({
  id: backendMsg.id,
  content: backendMsg.message,
  role: backendMsg.sender_role === SENDER_ROLE.CUSTOMER ? 'user' : 'assistant',
  timestamp: new Date(backendMsg.created_at),
});

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const addMessageIfNew = (messages: TestMessage[], newMessage: TestMessage): TestMessage[] => {
  if (messages.some((msg) => msg.id === newMessage.id)) {
    return messages;
  }
  return [...messages, newMessage];
};

export default function TestChat({ agentId }: TestChatProps) {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [conversation, setConversation] = useState<StudioConversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isSendingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout helper
  const clearAITimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Unsubscribe helper
  const unsubscribeChannel = useCallback(() => {
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Unsubscribe from channel
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, []);

  // Subscribe to Supabase real-time messages
  const subscribeToMessages = useCallback((conversationId: string) => {
    unsubscribeChannel();

    const handleInsert = (payload: RealtimePostgresChangesPayload<MessageResponse>) => {
      if (!payload.new || !isMountedRef.current) return;

      try {
        const newMessage = transformMessage(payload.new);
        setMessages((prev) => addMessageIfNew(prev, newMessage));

        if (payload.new.sender_role === SENDER_ROLE.AI_AGENT) {
          setIsSending(false);
          isSendingRef.current = false;
          clearAITimeout();
        }
      } catch (error) {
        logger.error('Error processing message', error);
      }
    };

    const handleUpdate = (payload: RealtimePostgresChangesPayload<MessageResponse>) => {
      if (!payload.new || !isMountedRef.current) return;

      try {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === payload.new.id ? transformMessage(payload.new) : msg))
        );
      } catch (error) {
        logger.error('Error updating message', error);
      }
    };

    // Handle typing broadcasts
    const handleTyping = (payload: { payload: { user_id: string; is_typing: boolean } }) => {
      if (!isMountedRef.current) return;

      const { user_id, is_typing } = payload.payload;

      // Only show typing indicator if it's not from the studio user (us)
      if (user_id !== 'studio_user') {
        setIsOtherUserTyping(is_typing);

        // Auto-hide typing indicator after 3 seconds of no updates
        if (is_typing) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherUserTyping(false);
          }, 3000);
        } else {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
        }
      }
    };

    const channel = supabase
      .channel(`test_chat_${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chats',
        filter: `conversation_id=eq.${conversationId}`,
      }, handleInsert)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chats',
        filter: `conversation_id=eq.${conversationId}`,
      }, handleUpdate)
      .on('broadcast', { event: 'typing' }, handleTyping)
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.error(`Subscription ${status.toLowerCase()}`, err);
          toast.error('Failed to connect to real-time updates');
        }
      });

    channelRef.current = channel;
  }, [unsubscribeChannel, clearAITimeout]);

  // Initialize conversation
  const initializeConversation = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);
      setMessages([]);

      const widget = await testChatService.getAgentWidget(agentId);
      if (!isMountedRef.current) return;

      const conv = await testChatService.initStudioConversation(widget.id);
      if (!isMountedRef.current) return;

      setConversation(conv);
      subscribeToMessages(conv.id);
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize chat';
      setError(errorMessage);
      logger.error('Failed to initialize test chat', err);
      toast.error(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsInitializing(false);
      }
    }
  }, [agentId, subscribeToMessages]);

  // Initialize on mount or agent change
  useEffect(() => {
    isMountedRef.current = true;
    initializeConversation();

    return () => {
      isMountedRef.current = false;
      unsubscribeChannel();
      clearAITimeout();
    };
    // Only re-run when agentId changes, not when callbacks change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Use instant scroll during rapid updates to avoid jank
    const behavior = messages.length > 10 ? 'instant' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [inputMessage]);

  // Handle new conversation - resets everything
  const handleNewConversation = useCallback(() => {
    clearAITimeout();
    unsubscribeChannel();
    initializeConversation();
  }, [clearAITimeout, unsubscribeChannel, initializeConversation]);

  // Send message handler
  const handleSend = useCallback(async () => {
    // Prevent duplicate sends with synchronous ref check
    if (isSendingRef.current) return;

    const trimmedMessage = inputMessage.trim();

    // Early validation
    if (isSending || !conversation) return;

    if (!trimmedMessage) {
      toast.error('Please enter a message');
      return;
    }

    // Set synchronous flag before any state updates
    isSendingRef.current = true;
    setInputMessage('');
    setIsSending(true);
    clearAITimeout();

    timeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      logger.warn('AI response timeout');
      setIsSending(false);
      isSendingRef.current = false;
      timeoutRef.current = null;
    }, AI_RESPONSE_TIMEOUT);

    try {
      const userMessageResponse = await testChatService.sendTestMessage({
        conversationId: conversation.id,
        message: trimmedMessage,
        agentId,
      });

      if (!isMountedRef.current) return;

      const userMessage = transformMessage(userMessageResponse);
      setMessages((prev) => addMessageIfNew(prev, userMessage));
    } catch (err) {
      if (!isMountedRef.current) return;

      clearAITimeout();
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      toast.error(errorMessage);
      logger.error('Failed to send message', err);
      setIsSending(false);
      isSendingRef.current = false;
    }
  }, [inputMessage, isSending, conversation, agentId, clearAITimeout]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-6" role="status" aria-live="polite">
        <Loader2 className="w-12 h-12 animate-spin text-neutral-400 mb-4" aria-hidden="true" />
        <p className="text-sm text-neutral-600">Initializing test environment...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-6" role="alert" aria-live="assertive">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
        </div>
        <p className="text-neutral-950 font-medium mb-1">Failed to Initialize</p>
        <p className="text-sm text-neutral-600 max-w-sm text-center mb-4">{error}</p>
        <button
          onClick={handleNewConversation}
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors"
          aria-label="Try initializing chat again"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* New Conversation Button - Floats at top when messages exist */}
      {messages.length > 0 && (
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-md shadow-sm hover:bg-neutral-50 hover:shadow-md transition-all duration-200"
            aria-label="Start a new conversation"
          >
            <RefreshCw className="w-4 h-4 text-neutral-600" aria-hidden="true" />
            <span className="hidden sm:inline text-sm text-neutral-600 font-medium">New conversation</span>
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-950 font-medium mb-1">Start Testing</p>
            <p className="text-sm text-neutral-600 max-w-full sm:max-w-sm">
              Send a message below to test your agent's responses based on the current prompt and knowledge bases.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const formattedTime = formatTime(message.timestamp);
              const messageLabel = `${message.role === 'user' ? 'Your message' : 'AI assistant message'} sent at ${formattedTime}`;

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex mb-4',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                  role="article"
                  aria-label={messageLabel}
                >
                  <div
                    className={cn(
                      'max-w-[90%] sm:max-w-[85%] lg:max-w-[70%] rounded-2xl p-3 sm:p-4 border',
                      'transition-shadow duration-200 hover:shadow-sm',
                      message.role === 'user'
                        ? 'bg-white text-black border-neutral-200'
                        : 'bg-black text-white border-black'
                    )}
                  >
                    {/* Message Content */}
                    <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {message.content}
                    </div>

                    {/* Timestamp */}
                    <div
                      className={cn(
                        'text-xs opacity-60 mt-2',
                        message.role === 'user' ? 'text-right' : 'text-left'
                      )}
                    >
                      {formattedTime}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator - shows based on broadcast events */}
            {isOtherUserTyping && (
              <div className="flex justify-start" role="status" aria-live="polite" aria-label="AI is typing">
                <div className="bg-neutral-100 rounded-2xl px-5 py-4 border border-neutral-200">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms', animationDuration: '1s' }}
                      aria-hidden="true"
                    />
                    <span
                      className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms', animationDuration: '1s' }}
                      aria-hidden="true"
                    />
                    <span
                      className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms', animationDuration: '1s' }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Composer */}
      <div className="border-t border-neutral-200 p-3 sm:p-4 bg-white">
        <div className="flex items-end gap-2 sm:gap-3">
          {/* Text Input */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message to test your agent..."
              disabled={isSending}
              rows={1}
              className={cn(
                'w-full px-3 sm:px-4 py-3 rounded-lg resize-none',
                'bg-neutral-50 border border-neutral-200',
                'focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent',
                'placeholder:text-neutral-400',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'text-sm leading-relaxed'
              )}
              style={{
                maxHeight: '150px',
                minHeight: '48px',
              }}
              aria-label="Message input"
              aria-describedby="message-helper-text"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isSending}
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-lg',
              'flex items-center justify-center',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              inputMessage.trim() && !isSending
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-neutral-200 text-neutral-400'
            )}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Helper text - Hidden on mobile */}
        <p id="message-helper-text" className="hidden sm:block text-xs text-neutral-500 mt-2">
          Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 font-mono">Enter</kbd> to send
          or <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 font-mono">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
