/**
 * Unified Chat View
 * Reusable presentation component for chat interfaces
 * Used by both TestChat (Studio) and ChatPanel (Conversations)
 */

import { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '../../types/conversation.types';
import { isCustomerMessage } from '../../types';
import ChatMessageBubble from './ChatMessageBubble';
import MessageComposer from './MessageComposer';
import DateSeparator from './DateSeparator';
import { ChatMessagesSkeleton } from '../shared/LoadingSkeleton';

export interface UnifiedChatViewProps {
  // From ChatEngine
  messages: ChatMessage[];
  isLoading: boolean;
  isAITyping?: boolean;
  onSendMessage: (message: string, attachments?: string) => Promise<void>;
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
  conversationId: string;
  agentId?: string;

  // Styling
  className?: string;
}

/**
 * Default empty state when no messages
 */
function DefaultEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <Send className="w-8 h-8 text-neutral-400" />
      </div>
      <p className="text-neutral-950 font-medium mb-1">{t('conversations.no_messages_yet')}</p>
      <p className="text-sm text-neutral-600 max-w-sm">
        {t('conversations.start_conversation_hint')}
      </p>
    </div>
  );
}

/**
 * Skeleton loading state during initialization
 * Uses realistic chat bubble skeletons with shimmer effect
 */
function LoadingState() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
      className="h-full flex flex-col bg-white"
    >
      <div className="flex-1 overflow-hidden">
        <ChatMessagesSkeleton />
      </div>
    </motion.div>
  );
}

/**
 * Helper function to check if two dates are on the same day
 */
function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
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
  conversationId,
  agentId,
  className,
}: UnifiedChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Track which message IDs have been rendered — new ones get animated, existing ones don't
  const seenMessageIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  // After each render, mark all current messages as seen (keyed by correlation_id or id)
  useEffect(() => {
    messages.forEach((m) => {
      seenMessageIds.current.add(m.id);
      if (m.correlation_id) seenMessageIds.current.add(m.correlation_id);
    });
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [messages]);

  // Reset when conversation changes
  useEffect(() => {
    seenMessageIds.current.clear();
    isInitialLoad.current = true;
    lastMessageIdRef.current = null;
  }, [conversationId]);

  // Track the last message ID to detect appended messages vs pagination prepends
  const lastMessageIdRef = useRef<string | null>(null);

  // Callback ref: scrolls to bottom the instant the anchor element mounts in the DOM.
  // This fires after AnimatePresence mounts the chat view, avoiding all timing issues.
  const scrollAnchorRef = useCallback((node: HTMLDivElement | null) => {
    messagesEndRef.current = node;
    if (node) {
      node.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      lastMessageIdRef.current = messages[messages.length - 1]?.id ?? null;
    }
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when new messages are appended (not pagination prepends)
  useEffect(() => {
    if (messages.length === 0) return;
    const currentLastId = messages[messages.length - 1]?.id;
    if (currentLastId === lastMessageIdRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    lastMessageIdRef.current = currentLastId ?? null;
  }, [messages]);

  // Handle "load more" when scrolling to top (pagination)
  const isLoadingMoreRef = useRef(false);
  const handleScrollToTop = useCallback(() => {
    if (!onLoadMore || isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    onLoadMore();
    // Reset after a short delay to prevent rapid re-fires
    setTimeout(() => { isLoadingMoreRef.current = false; }, 500);
  }, [onLoadMore]);

  useEffect(() => {
    if (!enablePagination || !onLoadMore || !hasMore) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 50) {
        handleScrollToTop();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [enablePagination, onLoadMore, hasMore, handleScrollToTop]);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingState />
      ) : (
    <motion.div
      key="chat"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('h-full flex flex-col min-h-0 bg-white relative', className)}
    >
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
            {/* Message list with date separators */}
            {messages.map((message, index) => {
              const showDateSeparator =
                index === 0 ||
                !isSameDay(message.created_at, messages[index - 1].created_at);
              const isUser = isCustomerMessage(message);
              const trackingKey = message.correlation_id || message.id;
              const animate = !isInitialLoad.current && !seenMessageIds.current.has(trackingKey);

              return (
                <motion.div
                  key={message.id}
                  initial={animate ? { opacity: 0, y: 8, x: isUser ? 12 : -12 } : false}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={animate ? { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] } : { duration: 0 }}
                >
                  {/* Date separator */}
                  {showDateSeparator && <DateSeparator date={message.created_at} />}

                  {/* Message */}
                  <ChatMessageBubble
                    message={message}
                    onRetry={
                      message.sendStatus === 'error' && onRetryMessage
                        ? () => onRetryMessage(message.id)
                        : undefined
                    }
                  />
                </motion.div>
              );
            })}

            {/* Typing indicator - AI is generating response */}
            <AnimatePresence>
              {isAITyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex justify-start px-2 py-1"
                  role="status"
                  aria-live="polite"
                  aria-label="AI is typing"
                >
                  <div className="flex gap-1.5">
                    <span
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms', animationDuration: '1s' }}
                      aria-hidden="true"
                    />
                    <span
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms', animationDuration: '1s' }}
                      aria-hidden="true"
                    />
                    <span
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms', animationDuration: '1s' }}
                      aria-hidden="true"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scroll anchor */}
            <div ref={scrollAnchorRef} />
          </>
        )}
      </div>

      {/* Message Composer */}
      <div
        className="flex-shrink-0 px-3 sm:px-4"
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
          conversationId={conversationId}
          agentId={agentId}
        />
      </div>

      {/* Optional footer slot */}
      {footer}
    </motion.div>
      )}
    </AnimatePresence>
  );
}
