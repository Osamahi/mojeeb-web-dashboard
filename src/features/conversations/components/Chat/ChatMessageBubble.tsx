/**
 * Chat Message Bubble Component
 * WhatsApp-style message bubbles with formatted text
 * User = WHITE background + BLACK text
 * Assistant = BLACK background + WHITE text
 * Supports optimistic updates with status indicators
 */

import { memo, useState, useEffect, useRef } from 'react';
import { Copy, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
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

  // Copy feedback state
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();

  // Alignment constants to avoid duplication
  const horizontalAlign = isUser ? 'justify-end' : 'justify-start';
  const verticalAlign = isUser ? 'items-end' : 'items-start';

  // Detect RTL for Arabic text
  const isRTL = isArabicText(messageText);

  // Bubble colors
  const bubbleStyle = isUser ? CHAT_BUBBLE_COLORS.user : CHAT_BUBBLE_COLORS.assistant;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Handle copy to clipboard with visual feedback and cleanup
  const handleCopy = () => {
    if (messageText) {
      navigator.clipboard.writeText(messageText);
      chatToasts.copied();

      // Clear existing timeout if any
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      // Show checkmark for 2 seconds
      setIsCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  return (
    <div className={cn('flex mb-4', horizontalAlign)}>
      {/* Wrapper for bubble + footer */}
      <div className={cn('flex flex-col max-w-[70%]', verticalAlign)}>
        {/* Message Bubble */}
        <div
          className={cn(
            'p-4 border',
            'transition-all duration-200',
            'hover:shadow-sm',
            // WhatsApp-style directional corners (slightly less pointed)
            isUser
              ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md' // Slightly rounded bottom-right
              : 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-md', // Slightly rounded bottom-left
            isOptimistic && 'opacity-70',
            hasError && 'border-red-300 border-2'
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
                // XSS Protection Chain:
                // 1. parseFormattedText uses marked library for safe markdown parsing
                // 2. DOMPurify sanitizes the output HTML to remove any malicious content
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(parseFormattedText(messageText, bubbleStyle.color)),
                }}
              />
            )}
          </>
        )}
        </div>

        {/* Footer: Status + Timestamp + Copy Button (Outside bubble) - Hidden for deleted messages */}
        {!isDeleted && (
          <div className={cn('flex items-center gap-2 mt-1 px-1', horizontalAlign)}>
          {/* Status indicator (optimistic/error) */}
          {isOptimistic && (
            <div className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-neutral-500" />
              <span className="text-xs text-neutral-500">
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
            <span className="text-xs text-neutral-500">
              {formatMessageTime(message.created_at)}
            </span>
          )}

          {/* Copy button with visual feedback */}
          {!hasError && (
            <button
              onClick={handleCopy}
              className={cn(
                "p-1 rounded transition-all",
                isCopied ? "bg-green-100" : "hover:bg-neutral-100"
              )}
              title={isCopied ? "Copied!" : "Copy message"}
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 text-neutral-500" />
              )}
            </button>
          )}
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatMessageBubble;
