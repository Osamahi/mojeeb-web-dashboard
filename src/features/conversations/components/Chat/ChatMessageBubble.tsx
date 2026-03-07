/**
 * Chat Message Bubble Component
 * WhatsApp-style message bubbles with formatted text
 * User = WHITE background + BLACK text
 * Assistant = BLACK background + WHITE text
 * Supports optimistic updates with status indicators
 */

import { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, CheckCheck, Loader2, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { ChatMessage } from '../../types';
import { isCustomerMessage, parseAttachments, isMessageDeleted, isVideoAttachment, MessageStatus } from '../../types';
import { formatMessageTime } from '../../utils/timeFormatters';
import { parseFormattedText, isArabicText } from '../../utils/textFormatters';
import { cn } from '@/lib/utils';
import { chatToasts } from '../../utils/chatToasts';
import { CHAT_BUBBLE_COLORS } from '../../constants/chatBubbleColors';
import { ImageModal } from './ImageModal';
import { AudioPlayer } from './AudioPlayer';
import { logger } from '@/lib/logger';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
}

const ChatMessageBubble = memo(function ChatMessageBubble({ message, onRetry }: ChatMessageBubbleProps) {
  const { t } = useTranslation();
  const isUser = isCustomerMessage(message);
  const isDeleted = isMessageDeleted(message);
  const messageText = message.message || '';

  // Memoize attachment parsing (avoid re-parsing on every state change)
  const { images, audio, files } = useMemo(() => {
    const parsed = parseAttachments(message.attachments);
    return {
      images: parsed?.images || [],
      audio: parsed?.audio || [],
      files: parsed?.files || [],
    };
  }, [message.attachments]);

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

  // Derived layout values
  const horizontalAlign = isUser ? 'justify-end' : 'justify-start';
  const verticalAlign = isUser ? 'items-end' : 'items-start';
  const isRTL = isArabicText(messageText);
  const bubbleStyle = isUser ? CHAT_BUBBLE_COLORS.user : CHAT_BUBBLE_COLORS.assistant;

  // Memoize expensive HTML sanitization (markdown parse + DOMPurify)
  const sanitizedHtml = useMemo(() => {
    if (!messageText || isDeleted) return '';
    return DOMPurify.sanitize(parseFormattedText(messageText, bubbleStyle.color));
  }, [messageText, isDeleted, bubbleStyle.color]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!messageText) return;
    try {
      await navigator.clipboard.writeText(messageText);
      chatToasts.copied();

      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setIsCopied(true);
      copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard API can fail in insecure contexts or when denied
      chatToasts.sendError();
    }
  }, [messageText]);

  const handleImageLoad = useCallback((index: number) => {
    logger.debug('[ChatMessageBubble]', 'Image loaded', { messageId: message.id, index });
    setLoadedImages(prev => new Set(prev).add(index));
  }, [message.id]);

  const handleImageError = useCallback((index: number) => {
    logger.error('[ChatMessageBubble]', 'Image load failed', { messageId: message.id, index });
    setErrorImages(prev => new Set(prev).add(index));
  }, [message.id]);

  return (
    <div className={cn('flex mb-4', horizontalAlign)}>
      <div className={cn('group flex flex-col max-w-[70%]', verticalAlign)}>
        {/* Images & Videos - Rendered OUTSIDE bubble, above it */}
        {!isDeleted && images.length > 0 && (
          <div className={cn('mb-2 flex flex-wrap gap-2', horizontalAlign)}>
            {images.map((img, idx) => {
              const isLoaded = loadedImages.has(idx);
              const imgHasError = errorImages.has(idx);
              const isVideo = isVideoAttachment(img);

              return (
                <div
                  key={idx}
                  className={cn(
                    'relative rounded-lg overflow-hidden',
                    isVideo ? 'w-[40%] max-w-[320px]' : 'w-[15%] aspect-square'
                  )}
                >
                  {/* Skeleton Placeholder */}
                  {!isLoaded && !imgHasError && (
                    <div className={cn('bg-neutral-200 animate-pulse', isVideo ? 'aspect-video' : 'absolute inset-0')}>
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    </div>
                  )}

                  {/* Error State */}
                  {imgHasError && (
                    <div className={cn(
                      'bg-neutral-100 border border-neutral-200 flex items-center justify-center',
                      isVideo ? 'aspect-video' : 'absolute inset-0'
                    )}>
                      <AlertCircle className="w-6 h-6 text-neutral-400" />
                    </div>
                  )}

                  {/* Video or Image */}
                  {!imgHasError && isVideo ? (
                    <video
                      src={img.url}
                      controls
                      playsInline
                      preload="metadata"
                      className={cn(
                        'w-full rounded-lg',
                        'transition-opacity duration-300',
                        isLoaded ? 'opacity-100' : 'opacity-0'
                      )}
                      onLoadedData={() => handleImageLoad(idx)}
                      onError={() => handleImageError(idx)}
                      onClick={() => isLoaded && setSelectedImageIndex(idx)}
                    />
                  ) : !imgHasError ? (
                    <img
                      src={img.url}
                      alt={img.filename || 'Attachment'}
                      className={cn(
                        'w-full h-full object-cover cursor-pointer hover:opacity-90',
                        'transition-opacity duration-300',
                        isLoaded ? 'opacity-100' : 'opacity-0'
                      )}
                      onClick={() => isLoaded && setSelectedImageIndex(idx)}
                      onLoad={() => handleImageLoad(idx)}
                      onError={() => handleImageError(idx)}
                      loading="lazy"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Audio Players - Rendered OUTSIDE bubble, above it */}
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

        {/* Document Attachments - Rendered OUTSIDE bubble, above it */}
        {!isDeleted && files.length > 0 && (
          <div className={cn('mb-2 flex flex-col gap-2', horizontalAlign)}>
            {files.map((file, idx) => (
              <a
                key={idx}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg border min-w-[250px] max-w-[400px]',
                  'transition-colors duration-150',
                  isUser
                    ? 'bg-white border-neutral-200 hover:bg-neutral-50'
                    : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
                )}
              >
                <FileText className={cn(
                  'w-8 h-8 flex-shrink-0',
                  isUser ? 'text-neutral-500' : 'text-neutral-400'
                )} />
                <div className="flex flex-col min-w-0">
                  <span className={cn(
                    'text-sm font-medium truncate',
                    isUser ? 'text-neutral-900' : 'text-white'
                  )}>
                    {file.filename || t('conversations.document_attachment')}
                  </span>
                  <span className={cn(
                    'text-xs',
                    isUser ? 'text-neutral-500' : 'text-neutral-400'
                  )}>
                    {t('conversations.tap_to_open')}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Message Bubble */}
        {(messageText || isDeleted) && (
          <div
            className={cn(
              'p-4 border',
              'transition-all duration-200',
              'hover:shadow-sm',
              isUser
                ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md'
                : 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-md',
              isOptimistic && 'opacity-70',
              hasError && 'border-red-300 border-2'
            )}
            style={bubbleStyle}
          >
          {isDeleted ? (
            <div className="italic opacity-60 text-sm">
              {t('conversations.message_deleted')}
            </div>
          ) : (
            messageText && (
              <div
                className="text-sm leading-relaxed break-words"
                style={{
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr',
                }}
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            )
          )}
          </div>
        )}

        {/* Footer: Status + Timestamp + Copy Button */}
        {!isDeleted && (
          <div className={cn('flex items-center gap-1.5 mt-0.5 px-1', horizontalAlign)}>
          {/* Error state */}
          {hasError && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-500">{t('conversations.message_send_failed')}</span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium underline"
                  title={t('conversations.retry_sending')}
                >
                  <RefreshCw className="w-3 h-3" />
                  {t('conversations.retry')}
                </button>
              )}
            </div>
          )}

          {/* Timestamp - always visible (except error) */}
          {!hasError && (
            <span className={cn(
              'text-[11px] text-neutral-500',
              isOptimistic ? 'opacity-40' : 'opacity-50'
            )}>
              {formatMessageTime(message.created_at)}
            </span>
          )}

          {/* Delivery status ticks — only for outbound (non-customer) messages */}
          {!hasError && !isUser && (
            <span className="relative flex items-center group/tick cursor-default">
              {isOptimistic ? (
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              ) : message.status === MessageStatus.Read ? (
                <CheckCheck className="w-4 h-4 text-green-500" strokeWidth={2.5} />
              ) : message.status === MessageStatus.Delivered ? (
                <CheckCheck className="w-4 h-4 text-neutral-300" strokeWidth={2.5} />
              ) : (
                <Check className="w-4 h-4 text-neutral-300" strokeWidth={2.5} />
              )}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-medium text-white bg-neutral-800 rounded shadow-sm whitespace-nowrap opacity-0 group-hover/tick:opacity-100 transition-opacity pointer-events-none">
                {isOptimistic ? 'Sending...' :
                  message.status === MessageStatus.Read ? 'Read' :
                  message.status === MessageStatus.Delivered ? 'Delivered' :
                  message.status === MessageStatus.Failed ? 'Failed' : 'Sent'}
              </span>
            </span>
          )}

          {/* Copy button — visible on hover only */}
          {!hasError && (
            <button
              onClick={handleCopy}
              className={cn(
                "p-1 rounded transition-all",
                isCopied ? "bg-green-100 opacity-100" : "opacity-0 group-hover:opacity-100 hover:bg-neutral-100"
              )}
              title={isCopied ? t('conversations.copied') : t('conversations.copy_message')}
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
