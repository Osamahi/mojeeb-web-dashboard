/**
 * Chat Message Bubble Component
 * WhatsApp-style message bubbles with formatted text
 * User = WHITE background + BLACK text
 * Assistant = BLACK background + WHITE text
 * Supports optimistic updates with status indicators
 */

import { memo } from 'react';
import { Copy, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { ChatMessage } from '../../types';
import { isCustomerMessage, parseAttachments, isMessageDeleted } from '../../types';
import { formatMessageTime } from '../../utils/timeFormatters';
import { parseFormattedText, isArabicText } from '../../utils/textFormatters';
import { cn } from '@/lib/utils';
import { chatToasts } from '../../utils/chatToasts';
import { CHAT_BUBBLE_COLORS } from '../../constants/chatBubbleColors';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void; // For error state retry
}

const ChatMessageBubble = memo(function ChatMessageBubble({ message, onRetry }: ChatMessageBubbleProps) {
  const isUser = isCustomerMessage(message);
  const isDeleted = isMessageDeleted(message);
  const attachments = parseAttachments(message.attachments);
  const images = attachments?.images || [];
  const messageText = message.message || '';

  // Optimistic update states
  const isOptimistic = message.isOptimistic || message.sendStatus === 'sending';
  const hasError = message.sendStatus === 'error';

  // Detect RTL for Arabic text
  const isRTL = isArabicText(messageText);

  // Bubble colors
  const bubbleStyle = isUser ? CHAT_BUBBLE_COLORS.user : CHAT_BUBBLE_COLORS.assistant;

  // Handle copy to clipboard
  const handleCopy = () => {
    if (messageText) {
      navigator.clipboard.writeText(messageText);
      chatToasts.copied();
    }
  };

  return (
    <div
      className={cn(
        'flex mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-2xl p-4 border',
          'transition-all duration-200',
          'hover:shadow-sm',
          isOptimistic && 'opacity-70', // Subtle feedback for sending messages
          hasError && 'border-red-300 border-2' // Error state
        )}
        style={bubbleStyle}
      >
        {isDeleted ? (
          <div className="italic opacity-60 text-sm">
            This message was deleted
          </div>
        ) : (
          <>
            {/* Images */}
            {images.length > 0 && (
              <div className={cn('mb-3', images.length === 1 ? '' : 'grid grid-cols-2 gap-2')}>
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.url}
                    alt={img.filename || 'Attachment'}
                    className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(img.url, '_blank')}
                  />
                ))}
              </div>
            )}

            {/* Message Text */}
            {messageText && (
              <div
                className="text-sm leading-relaxed break-words"
                style={{
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr',
                }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(parseFormattedText(messageText, bubbleStyle.color)),
                }}
              />
            )}

            {/* Footer: Status + Timestamp + Copy Button */}
            <div className={cn(
              'flex items-center gap-2 mt-2 pt-1',
              isUser ? 'justify-end' : 'justify-between'
            )}>
              {/* Status indicator (optimistic/error) */}
              {isOptimistic && (
                <div className="flex items-center gap-1">
                  <Loader2
                    className="w-3 h-3 animate-spin"
                    style={{ color: bubbleStyle.color, opacity: 0.6 }}
                  />
                  <span
                    className="text-xs opacity-60"
                    style={{ color: bubbleStyle.color }}
                  >
                    Sending...
                  </span>
                </div>
              )}

              {/* Error state */}
              {hasError && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-500">Failed to send</span>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium underline"
                      title="Retry sending message"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* Timestamp (hide when sending) */}
              {!isOptimistic && !hasError && (
                <span
                  className="text-xs opacity-60"
                  style={{ color: bubbleStyle.color }}
                >
                  {formatMessageTime(message.created_at)}
                </span>
              )}

              {/* Copy button */}
              {!hasError && (
                <button
                  onClick={handleCopy}
                  className={cn(
                    'p-1 rounded hover:bg-opacity-10 transition-colors',
                    isUser ? 'hover:bg-black' : 'hover:bg-white'
                  )}
                  title="Copy message"
                >
                  <Copy
                    className="w-3 h-3 opacity-60"
                    style={{ color: bubbleStyle.color }}
                  />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default ChatMessageBubble;
