/**
 * Message Composer Component
 * WhatsApp-style input for sending messages
 * Enter to send, Shift+Enter for new line
 */

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface MessageComposerProps {
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  isAIMode?: boolean;
  placeholder?: string;
}

export default function MessageComposer({
  onSendMessage,
  isSending,
  isAIMode = true,
  placeholder = 'Type a message...',
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [message]);

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

  return (
    <div className="bg-white border-t border-neutral-200 p-4">
      <div className="flex items-end gap-3">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSending}
            rows={1}
            className={cn(
              'w-full px-4 py-3 pr-12 rounded-lg resize-none',
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
          />

          {/* Mode indicator */}
          {!isAIMode && (
            <div className="absolute right-3 bottom-3 text-xs text-orange-500 font-medium">
              Human
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-lg',
            'flex items-center justify-center',
            'transition-all duration-200',
            message.trim() && !isSending
              ? 'bg-brand-cyan text-white hover:bg-brand-cyan/90 hover:scale-105'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          )}
          title="Send message (Enter)"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Hint */}
      <div className="mt-2 text-xs text-neutral-500">
        Press <kbd className="px-1 py-0.5 bg-neutral-100 rounded">Enter</kbd> to send,{' '}
        <kbd className="px-1 py-0.5 bg-neutral-100 rounded">Shift + Enter</kbd> for new line
      </div>
    </div>
  );
}
