/**
 * Message Composer Component
 * ChatGPT-inspired two-line minimal design
 * Line 1: Clean input field
 * Line 2: Attachment, Emoji, Mode Toggle ... Send
 */

import { useState, KeyboardEvent, useRef, useEffect, useCallback, memo } from 'react';
import { ArrowUp, Loader2, Smile, Paperclip, Bot, User } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { chatToasts } from '../../utils/chatToasts';

// Constants
const MAX_TEXTAREA_HEIGHT_PX = 120;
const EMOJI_PICKER_WIDTH = 350;
const EMOJI_PICKER_HEIGHT = 400;
const MAX_MESSAGE_LENGTH = 5000; // Backend limit

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
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  isAIMode?: boolean;
  onModeToggle?: () => void;
  placeholder?: string;
}

export default memo(function MessageComposer({
  onSendMessage,
  isSending,
  isAIMode = true,
  onModeToggle,
  placeholder = 'Type your message...',
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLocalSending, setIsLocalSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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

    // Check if empty or already sending
    if (!sanitizedMessage || isSending || isLocalSending) return;

    // Check length limit
    if (sanitizedMessage.length > MAX_MESSAGE_LENGTH) {
      chatToasts.messageTooLong(MAX_MESSAGE_LENGTH);
      return;
    }

    setIsLocalSending(true);

    try {
      await onSendMessage(sanitizedMessage);

      // Only clear message on success
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      logger.error('Failed to send message', error, {
        messageLength: sanitizedMessage.length,
        component: 'MessageComposer',
        isAIMode,
      });
      chatToasts.sendError();
      // Don't clear message on error - let user retry
    } finally {
      setIsLocalSending(false);
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

  return (
    <div
      className={cn(
        'bg-neutral-50',
        'border border-neutral-200',
        'rounded-3xl',
        'p-4',
        'hover:border-neutral-300',
        'focus-within:border-neutral-400',
        'transition-colors duration-200',
        'relative'
      )}
    >
      {/* Line 1: Input Field */}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={isSending || isLocalSending}
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
          {/* Attachment Button (Coming Soon) */}
          <button
            className={cn(
              'p-2 rounded-lg',
              'text-neutral-300',
              'cursor-not-allowed',
              'opacity-60'
            )}
            disabled
            aria-disabled="true"
            aria-label="Attach file"
            title="File attachments coming soon"
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
          disabled={!message.trim() || isSending || isLocalSending}
          className={cn(
            'rounded-full w-10 h-10',
            'flex items-center justify-center',
            'flex-shrink-0',
            'transition-all duration-200',
            message.trim() && !isSending && !isLocalSending
              ? 'bg-neutral-950 text-white hover:bg-neutral-800 hover:scale-105'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          )}
          title="Send message (Enter)"
          aria-label="Send message"
        >
          {isSending || isLocalSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
});
