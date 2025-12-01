/**
 * Unified Chat View
 * Reusable presentation component for chat interfaces
 * Used by both TestChat (Studio) and ChatPanel (Conversations)
 */

import { useRef, useEffect } from 'react';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '../../types/conversation.types';
import ChatMessageBubble from './ChatMessageBubble';
import MessageComposer from './MessageComposer';

export interface UnifiedChatViewProps {
  // From ChatEngine
  messages: ChatMessage[];
  isLoading: boolean;
  isAITyping?: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onRetryMessage?: (messageId: string) => Promise<void>;

  // Customization slots
  header?: React.ReactNode;
  footer?: React.ReactNode;
  emptyStateCustom?: React.ReactNode;

  // Behavior
  enablePagination?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;

  // Message Composer props
  enableAIToggle?: boolean;
  isAIMode?: boolean;
  onModeToggle?: () => void;
  placeholder?: string;

  // Styling
  className?: string;
}

/**
 * Default empty state when no messages
 */
function DefaultEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <Send className="w-8 h-8 text-neutral-400" />
      </div>
      <p className="text-neutral-950 font-medium mb-1">No messages yet</p>
      <p className="text-sm text-neutral-600 max-w-sm">
        Start the conversation by sending a message below.
      </p>
    </div>
  );
}

/**
 * Loading state during initialization
 */
function LoadingState() {
  return (
    <div
      className="h-full flex flex-col items-center justify-center bg-white p-6"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-12 h-12 animate-spin text-neutral-400 mb-4" aria-hidden="true" />
      <p className="text-sm text-neutral-600">Loading messages...</p>
    </div>
  );
}

/**
 * Unified Chat View Component
 */
export default function UnifiedChatView({
  messages,
  isLoading,
  isAITyping = false,
  onSendMessage,
  onRetryMessage,
  header,
  footer,
  emptyStateCustom,
  enablePagination = false,
  onLoadMore,
  hasMore,
  enableAIToggle = false,
  isAIMode = true,
  onModeToggle,
  placeholder = 'Type your message...',
  className,
}: UnifiedChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Smooth scroll for better UX (instant for many messages)
    const behavior = messages.length > 10 ? 'instant' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior: behavior as ScrollBehavior });
  }, [messages]);

  // Handle "load more" when scrolling to top (pagination)
  useEffect(() => {
    if (!enablePagination || !onLoadMore || !hasMore) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If scrolled to top, load more
      if (container.scrollTop === 0) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [enablePagination, onLoadMore, hasMore]);

  // Show loading state during initialization
  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className={cn('h-full flex flex-col bg-white relative', className)}>
      {/* Optional header slot (e.g., conversation metadata, new conversation button) */}
      {header}

      {/* Messages Area - Padding adjusts based on header presence */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {/* Load more indicator (pagination) */}
        {enablePagination && hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={onLoadMore}
              className="text-sm text-neutral-600 hover:text-neutral-900 font-medium"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 ? (
          emptyStateCustom || <DefaultEmptyState />
        ) : (
          <>
            {/* Message list */}
            {messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                onRetry={
                  message.sendStatus === 'error' && onRetryMessage
                    ? () => onRetryMessage(message.id)
                    : undefined
                }
              />
            ))}

            {/* Typing indicator - AI is generating response */}
            {isAITyping && (
              <div
                className="flex justify-start"
                role="status"
                aria-live="polite"
                aria-label="AI is typing"
              >
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

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Composer */}
      <div
        className="px-3 sm:px-4 border-t border-neutral-200"
        style={{
          paddingTop: '12px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
        }}
      >
        <MessageComposer
          onSendMessage={onSendMessage}
          isSending={false} // NEVER block input - optimistic updates handle this
          isAIMode={isAIMode}
          onModeToggle={enableAIToggle ? onModeToggle : undefined}
          placeholder={placeholder}
        />
      </div>

      {/* Optional footer slot */}
      {footer}
    </div>
  );
}
