/**
 * Message Composer Component
 * ChatGPT-inspired two-line minimal design
 * Line 1: Clean input field
 * Line 2: Attachment, Emoji, Mode Toggle ... Send
 */

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { ArrowUp, Loader2, Smile, Paperclip, Bot, User, ChevronDown } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface MessageComposerProps {
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  isAIMode?: boolean;
  onModeToggle?: () => void;
  placeholder?: string;
}

export default function MessageComposer({
  onSendMessage,
  isSending,
  isAIMode = true,
  onModeToggle,
  placeholder = 'Type your message...',
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    try {
      await onSendMessage(trimmedMessage);
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      logger.error('Failed to send message', error);
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
        placeholder={placeholder}
        disabled={isSending}
        rows={1}
        className={cn(
          'w-full',
          'bg-transparent',
          'border-0',
          'outline-none',
          'resize-none',
          'text-sm',
          'text-neutral-950',
          'placeholder:text-neutral-400',
          'mb-3',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        style={{
          minHeight: '32px',
          maxHeight: '120px',
        }}
        aria-label="Message input"
        aria-multiline="true"
      />

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
                  width={350}
                  height={400}
                  searchPlaceHolder="Search emoji..."
                />
              </div>
            )}
          </div>

          {/* AI/Human Mode Toggle */}
          {onModeToggle && (
            <button
              onClick={onModeToggle}
              className={cn(
                'flex items-center gap-1.5',
                'px-2.5 py-1.5',
                'rounded-lg',
                'text-sm font-medium',
                'border border-neutral-200',
                'hover:bg-neutral-100',
                'transition-all duration-150'
              )}
              aria-label={`Switch mode. Current: ${isAIMode ? 'AI' : 'Human'}`}
              title={`Currently in ${isAIMode ? 'AI' : 'Human'} mode. Click to switch.`}
            >
              {isAIMode ? (
                <>
                  <Bot className="w-4 h-4 text-neutral-700" />
                  <span className="text-neutral-700">AI</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-brand-cyan" />
                  <span className="text-brand-cyan">Human</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
          )}
        </div>

        {/* Right: Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          className={cn(
            'rounded-full w-10 h-10',
            'flex items-center justify-center',
            'flex-shrink-0',
            'transition-all duration-200',
            message.trim() && !isSending
              ? 'bg-neutral-950 text-white hover:bg-neutral-800 hover:scale-105'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          )}
          title="Send message (Enter)"
          aria-label="Send message"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
