/**
 * Test Chat Component
 * Simple chat interface for testing agent prompts
 * Clean minimal design with message history and composer
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

interface TestMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface TestChatProps {
  agentId: string;
}

export default function TestChat({ agentId }: TestChatProps) {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [inputMessage]);

  const handleSend = async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || isSending) return;

    // Add user message immediately
    const userMessage: TestMessage = {
      id: `user-${Date.now()}`,
      content: trimmedMessage,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      // TODO: Replace with actual API call to test endpoint
      // const response = await testChatService.sendMessage(agentId, trimmedMessage);

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const assistantMessage: TestMessage = {
        id: `assistant-${Date.now()}`,
        content: 'This is a test response. The backend test endpoint will be implemented soon.',
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Test chat error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    toast.success('Conversation cleared');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">Test Chat</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Test your agent's responses in real-time
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClear}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-950 font-medium mb-1">Start Testing</p>
            <p className="text-sm text-neutral-600 max-w-sm">
              Send a message below to test your agent's responses based on the current prompt and knowledge bases.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex mb-4',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl p-4 border',
                    'transition-shadow duration-200 hover:shadow-sm',
                    message.role === 'user'
                      ? 'bg-white text-black border-neutral-200'
                      : 'bg-black text-white border-black'
                  )}
                >
                  {/* Message Content */}
                  <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {message.content}
                  </div>

                  {/* Timestamp */}
                  <div
                    className={cn(
                      'text-xs opacity-60 mt-2',
                      message.role === 'user' ? 'text-right' : 'text-left'
                    )}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 rounded-2xl p-4 border border-neutral-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                    <span className="text-sm text-neutral-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Composer */}
      <div className="border-t border-neutral-200 p-4 bg-white">
        <div className="flex items-end gap-3">
          {/* Text Input */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message to test your agent..."
              disabled={isSending}
              rows={1}
              className={cn(
                'w-full px-4 py-3 rounded-lg resize-none',
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
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isSending}
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-lg',
              'flex items-center justify-center',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              inputMessage.trim() && !isSending
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-neutral-200 text-neutral-400'
            )}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-neutral-500 mt-2">
          Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 font-mono">Enter</kbd> to send
          or <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 font-mono">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
