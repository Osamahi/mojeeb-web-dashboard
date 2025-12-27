/**
 * Chat Message Bubble Component
 * WhatsApp-style message bubbles with formatted text
 * User = WHITE background + BLACK text
 * Assistant = BLACK background + WHITE text
 * Supports optimistic updates with status indicators
 */

import { memo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { ChatMessage, MessageAttachment } from '../../types';
import { isCustomerMessage, parseAttachments, isMessageDeleted } from '../../types';
import { formatMessageTime } from '../../utils/timeFormatters';
import { parseFormattedText, isArabicText } from '../../utils/textFormatters';
import { cn } from '@/lib/utils';
import { chatToasts } from '../../utils/chatToasts';
import { CHAT_BUBBLE_COLORS } from '../../constants/chatBubbleColors';
import { ImageModal } from './ImageModal';
import { AudioPlayer } from './AudioPlayer';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void; // For error state retry
}

const ChatMessageBubble = memo(function ChatMessageBubble({ message, onRetry }: ChatMessageBubbleProps) {
  const { t } = useTranslation();
  const isUser = isCustomerMessage(message);
  const isDeleted = isMessageDeleted(message);

  const attachments = parseAttachments(message.attachments);
  const images = attachments?.images || [];
  const audio = attachments?.audio || [];
  const messageText = message.message || '';

  // Optimistic update states
  const isOptimistic = message.isOptimistic || message.sendStatus === 'sending';
  const hasError = message.sendStatus === 'error';

  // Copy feedback state
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Image modal state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Image loading states (for smooth UX with skeleton placeholders)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<number>>(new Set());

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

  // Handle image load success (smooth fade-in UX)
  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  // Handle image load error (show error icon)
  const handleImageError = (index: number) => {
    setErrorImages(prev => new Set(prev).add(index));
  };

  return (
    <div className={cn('flex mb-4', horizontalAlign)}>
      {/* Wrapper for bubble + footer */}
      <div className={cn('flex flex-col max-w-[70%]', verticalAlign)}>
        {/* Images - Rendered OUTSIDE bubble, above it */}
        {!isDeleted && images.length > 0 && (
          <div className={cn('mb-2 flex flex-wrap gap-2', horizontalAlign)}>
            {images.map((img, idx) => {
              const isLoaded = loadedImages.has(idx);
              const hasError = errorImages.has(idx);

              return (
                <div
                  key={idx}
                  className="relative w-[15%] aspect-square rounded-lg overflow-hidden"
                >
                  {/* Skeleton Placeholder (shows while loading) */}
                  {!isLoaded && !hasError && (
                    <div className="absolute inset-0 bg-neutral-200 animate-pulse">
                      {/* Shimmer effect overlay */}
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    </div>
                  )}

                  {/* Error State (failed to load) */}
                  {hasError && (
                    <div className="absolute inset-0 bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-neutral-400" />
                    </div>
                  )}

                  {/* Actual Image (with smooth fade-in) */}
                  {!hasError && (
                    <img
                      src={img.url}
                      alt={img.filename || 'Attachment'}
                      className={cn(
                        'w-full h-full object-cover cursor-pointer hover:opacity-90',
                        'transition-all duration-300',
                        isLoaded ? 'opacity-100' : 'opacity-0'
                      )}
                      onClick={() => isLoaded && setSelectedImageIndex(idx)}
                      onLoad={() => handleImageLoad(idx)}
                      onError={() => handleImageError(idx)}
                      loading="lazy" // Native lazy loading for off-screen images
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Audio Players - Rendered OUTSIDE bubble, above it (after images) */}
        {!isDeleted && audio.length > 0 && (
          <div className={cn('mb-2 flex flex-col gap-2', horizontalAlign)}>
            {audio.map((aud, idx) => (
              <div key={idx} className="min-w-[300px] max-w-[400px]">
                <AudioPlayer
                  url={aud.url}
                  filename={aud.filename}
                  isAssistantMessage={!isUser}
                />
              </div>
            ))}
          </div>
        )}

        {/* Message Bubble - Only show if there's text or message is deleted */}
        {(messageText || isDeleted) && (
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
        )}

        {/* Footer: Status + Timestamp + Copy Button (Outside bubble) - Hidden for deleted messages */}
        {!isDeleted && (
          <div className={cn('flex items-center gap-2 mt-0.5 px-1', horizontalAlign)}>
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
              <span className="text-xs text-red-500">{t('conversations.message_send_failed')}</span>
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

          {/* Timestamp (hide when sending) - Extra subtle */}
          {!isOptimistic && !hasError && (
            <span className="text-[11px] text-neutral-500 opacity-50">
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

      {/* Image Modal */}
      {selectedImageIndex !== null && (
        <ImageModal
          images={images}
          initialIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </div>
  );
});

export default ChatMessageBubble;
