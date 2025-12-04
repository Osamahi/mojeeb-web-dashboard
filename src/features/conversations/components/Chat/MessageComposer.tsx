/**
 * Message Composer Component
 * ChatGPT-inspired two-line minimal design
 * Line 1: Clean input field
 * Line 2: Attachment, Emoji, Mode Toggle ... Send
 */

import { useState, KeyboardEvent, useRef, useEffect, useCallback, memo } from 'react';
import { ArrowUp, Loader2, Smile, Paperclip, Bot, User, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { chatToasts } from '../../utils/chatToasts';

// Constants
const MAX_TEXTAREA_HEIGHT_PX = 120;
const EMOJI_PICKER_WIDTH = 350;
const EMOJI_PICKER_HEIGHT = 400;
const MAX_MESSAGE_LENGTH = 5000; // Backend limit
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGES = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const THUMBNAIL_SIZE_PX = 80;

/**
 * Sanitizes message input by removing potentially dangerous characters
 * and normalizing whitespace
 */
const sanitizeMessage = (msg: string): string => {
  // Trim and normalize whitespace (multiple spaces, tabs, etc.)
  let sanitized = msg.trim().replace(/\s+/g, ' ');

  // Remove zero-width characters that could be used maliciously
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
};

interface MessageComposerProps {
  onSendMessage: (message: string, attachments?: string) => Promise<void>;
  isSending: boolean;
  isAIMode?: boolean;
  onModeToggle?: () => void;
  placeholder?: string;
  conversationId: string;
  agentId?: string;
}

export default memo(function MessageComposer({
  onSendMessage,
  isSending,
  isAIMode = true,
  onModeToggle,
  placeholder = 'Type your message...',
  conversationId,
  agentId,
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLocalSending, setIsLocalSending] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea (optimized with useCallback)
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Force reflow before reading scrollHeight (iOS Safari fix)
    textarea.style.height = 'auto';
    void textarea.offsetHeight; // Force reflow

    const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT_PX);
    textarea.style.height = `${newHeight}px`;

    // iOS Safari needs explicit overflow handling
    textarea.style.overflowY = newHeight >= MAX_TEXTAREA_HEIGHT_PX ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Cleanup object URLs when component unmounts or images change
  useEffect(() => {
    // Create new URLs for selected images
    const urls = selectedImages.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(urls);

    // Cleanup function: revoke all URLs
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedImages]);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Mobile keyboard viewport handling using Visual Viewport API
  // More reliable than setTimeout - responds to actual keyboard appearance
  useEffect(() => {
    // Only apply on mobile devices
    if (!window.visualViewport || window.innerWidth >= 768) return;

    const handleViewportResize = () => {
      // Calculate keyboard height by comparing window height to visual viewport
      const keyboardHeight = window.innerHeight - (window.visualViewport?.height || window.innerHeight);

      // Keyboard is likely open if viewport shrunk by >100px
      if (keyboardHeight > 100) {
        // Use requestAnimationFrame for smooth, jank-free scrolling
        // Better than setTimeout as it syncs with browser paint cycle
        requestAnimationFrame(() => {
          textareaRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end', // Position at bottom (above keyboard), not center
            inline: 'nearest'
          });
        });
      }
    };

    // Listen to Visual Viewport resize events (keyboard open/close)
    window.visualViewport.addEventListener('resize', handleViewportResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSend = async () => {
    // Sanitize and validate message
    const sanitizedMessage = sanitizeMessage(message);

    // Check if empty or already sending/uploading
    if (!sanitizedMessage || isSending || isLocalSending || isUploadingImages) return;

    // Check length limit
    if (sanitizedMessage.length > MAX_MESSAGE_LENGTH) {
      chatToasts.messageTooLong(MAX_MESSAGE_LENGTH);
      return;
    }

    try {
      let attachmentsJson: string | undefined = undefined;

      // Upload images if any are selected
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);

        try {
          // Import chatApiService dynamically to avoid circular dependencies
          const { chatApiService } = await import('@/features/conversations/services/chatApiService');

          // Generate a temporary message ID for uploads
          const tempMessageId = crypto.randomUUID();

          logger.info('Starting image upload', { count: selectedImages.length });

          // Upload all images and build attachments JSON
          attachmentsJson = await chatApiService.uploadImagesAndBuildJSON({
            files: selectedImages,
            conversationId,
            messageId: tempMessageId,
          });

          logger.info('Images uploaded successfully', { count: selectedImages.length });
        } catch (uploadError) {
          logger.error('Failed to upload images', uploadError, {
            component: 'MessageComposer',
            imageCount: selectedImages.length,
          });
          chatToasts.sendError();
          setIsUploadingImages(false);
          return;
        } finally {
          setIsUploadingImages(false);
        }
      }

      // Clear composer state immediately after successful upload (optimistic update)
      setMessage('');
      setSelectedImages([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Now send the message with attachments (non-blocking for UI)
      setIsLocalSending(true);
      onSendMessage(sanitizedMessage, attachmentsJson).finally(() => {
        setIsLocalSending(false);
      });
    } catch (error) {
      logger.error('Failed to send message', error, {
        messageLength: sanitizedMessage.length,
        component: 'MessageComposer',
        isAIMode,
      });
      chatToasts.sendError();
      // Don't clear message on error - let user retry
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    let pastedText = e.clipboardData.getData('text/plain');

    // Sanitize pasted text
    pastedText = sanitizeMessage(pastedText);

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBefore = message.substring(0, cursorPosition);
    const textAfter = message.substring(textarea.selectionEnd);

    const newMessage = textBefore + pastedText + textAfter;

    // Check if exceeds limit
    if (newMessage.length > MAX_MESSAGE_LENGTH) {
      chatToasts.pasteTruncated(MAX_MESSAGE_LENGTH);
      const truncated = newMessage.substring(0, MAX_MESSAGE_LENGTH);
      setMessage(truncated);
    } else {
      setMessage(newMessage);
    }

    // Restore cursor position
    setTimeout(() => {
      const newPosition = Math.min(
        cursorPosition + pastedText.length,
        MAX_MESSAGE_LENGTH
      );
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file count
    if (selectedImages.length + files.length > MAX_IMAGES) {
      logger.warn(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        logger.warn(`Invalid file type: ${file.name}. Only JPEG and PNG are supported.`);
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        logger.warn(`File too large: ${file.name}. Maximum ${MAX_FILE_SIZE_MB}MB allowed.`);
        continue;
      }

      validFiles.push(file);
    }

    // Add valid files to selection
    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      logger.info(`Added ${validFiles.length} image(s)`, { count: validFiles.length });
    }

    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    logger.info('Removed image', { index });
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        'bg-white',
        'border border-neutral-300',
        'rounded-3xl',
        'p-4',
        'hover:border-neutral-400',
        'focus-within:border-neutral-500',
        'focus-within:shadow-sm',
        'transition-all duration-200',
        'relative'
      )}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload images"
      />

      {/* Image Previews - ChatGPT Style */}
      {selectedImages.length > 0 && imagePreviewUrls.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {selectedImages.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative flex-shrink-0 group"
              style={{ width: `${THUMBNAIL_SIZE_PX}px`, height: `${THUMBNAIL_SIZE_PX}px` }}
            >
              {/* Image Thumbnail */}
              <img
                src={imagePreviewUrls[index]}
                alt={`Selected image ${index + 1}`}
                className={cn(
                  "w-full h-full object-cover rounded-lg border border-neutral-200",
                  isUploadingImages && "opacity-50"
                )}
              />

              {/* Uploading Overlay */}
              {isUploadingImages && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/30 rounded-lg">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}

              {/* Remove Button - Hidden during upload */}
              {!isUploadingImages && (
                <button
                  onClick={() => handleRemoveImage(index)}
                  className={cn(
                    'absolute top-1 right-1',
                    'w-5 h-5',
                    'bg-neutral-800/70',
                    'text-white',
                    'rounded-full',
                    'flex items-center justify-center',
                    'hover:bg-neutral-950/90',
                    'transition-colors'
                  )}
                  aria-label={`Remove image ${index + 1}`}
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Line 1: Input Field */}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={isUploadingImages ? `Uploading ${selectedImages.length} image(s)...` : placeholder}
        disabled={isSending || isLocalSending || isUploadingImages}
        maxLength={MAX_MESSAGE_LENGTH}
        rows={1}
        inputMode="text"
        enterKeyHint="send"
        className={cn(
          'w-full',
          'bg-transparent',
          'border-0',
          'outline-none',
          'resize-none',
          'text-sm',
          'text-neutral-950',
          'placeholder:text-neutral-400',
          'mb-2',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        style={{
          minHeight: '32px',
          maxHeight: `${MAX_TEXTAREA_HEIGHT_PX}px`,
          fontSize: '16px', // Prevent iOS zoom on focus
        }}
        aria-label="Message input. Press Enter to send, Shift+Enter for new line"
        aria-multiline="true"
        aria-describedby="char-count"
      />

      {/* Character count (show when approaching limit) */}
      {message.length > MAX_MESSAGE_LENGTH * 0.8 && (
        <div
          id="char-count"
          className="text-xs text-neutral-500 mb-2 text-right"
          aria-live="polite"
        >
          {message.length} / {MAX_MESSAGE_LENGTH}
        </div>
      )}

      {/* Line 2: Actions Bar */}
      <div className="flex items-center justify-between">
        {/* Left: Action Icons */}
        <div className="flex items-center gap-2 relative">
          {/* Attachment Button */}
          <button
            onClick={handleAttachmentClick}
            className={cn(
              'p-2 rounded-lg',
              'text-neutral-500',
              'hover:bg-neutral-100',
              'hover:text-neutral-700',
              'transition-all duration-150',
              (isSending || isLocalSending || isUploadingImages) && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Attach images"
            title="Attach images (JPEG, PNG)"
            disabled={isSending || isLocalSending || isUploadingImages}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Emoji Picker */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn(
                'p-2 rounded-lg',
                'text-neutral-500',
                'hover:bg-neutral-100',
                'hover:text-neutral-700',
                'transition-all duration-150',
                showEmojiPicker && 'bg-neutral-100 text-neutral-700'
              )}
              aria-label="Add emoji"
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 mb-2 z-50"
                style={{
                  filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))',
                }}
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={EMOJI_PICKER_WIDTH}
                  height={EMOJI_PICKER_HEIGHT}
                  searchPlaceHolder="Search emoji..."
                />
              </div>
            )}
          </div>

          {/* AI/Human Mode Toggle Switch */}
          {onModeToggle && (
            <div className="flex items-center gap-2">
              {/* Label */}
              <div className="flex items-center gap-1.5">
                {isAIMode ? (
                  <>
                    <Bot className="w-4 h-4 text-neutral-700" />
                    <span className="text-xs font-medium text-neutral-700">AI</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-brand-cyan" />
                    <span className="text-xs font-medium text-brand-cyan">Human</span>
                  </>
                )}
              </div>

              {/* Toggle Switch */}
              <button
                onClick={onModeToggle}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full',
                  'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2',
                  isAIMode ? 'bg-neutral-300' : 'bg-brand-cyan'
                )}
                role="switch"
                aria-checked={!isAIMode}
                aria-label={`Toggle mode. Currently ${isAIMode ? 'AI' : 'Human'} mode`}
                title={`Click to switch to ${isAIMode ? 'Human' : 'AI'} mode`}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
                    isAIMode ? 'translate-x-1' : 'translate-x-6'
                  )}
                />
              </button>
            </div>
          )}
        </div>

        {/* Right: Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending || isLocalSending || isUploadingImages}
          className={cn(
            'rounded-full w-10 h-10',
            'flex items-center justify-center',
            'flex-shrink-0',
            'transition-all duration-200',
            message.trim() && !isSending && !isLocalSending && !isUploadingImages
              ? 'bg-neutral-950 text-white hover:bg-neutral-800 hover:scale-105'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          )}
          title={
            isUploadingImages
              ? `Uploading ${selectedImages.length} image(s)...`
              : isSending || isLocalSending
              ? 'Sending...'
              : 'Send message (Enter)'
          }
          aria-label="Send message"
        >
          {isSending || isLocalSending || isUploadingImages ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
});
