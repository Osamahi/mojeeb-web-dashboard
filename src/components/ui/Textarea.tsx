/**
 * Mojeeb Minimal Textarea Component
 * Clean, accessible textarea with auto-resize functionality
 * Features: Label, error states, character count, auto-expanding height
 */

import { TextareaHTMLAttributes, forwardRef, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  maxChars?: number;
  autoResize?: boolean;
  minHeight?: number; // in pixels
  maxHeight?: number; // in pixels
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCharCount = false,
      maxChars,
      autoResize = true,
      minHeight = 80,
      maxHeight = 400,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const [charCount, setCharCount] = useState(0);

    // Combine external ref with internal ref
    const textareaRef = (node: HTMLTextAreaElement) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // Auto-resize functionality
    useEffect(() => {
      if (autoResize && internalRef.current) {
        const textarea = internalRef.current;
        textarea.style.height = `${minHeight}px`;
        const scrollHeight = textarea.scrollHeight;
        const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
        textarea.style.height = `${newHeight}px`;
      }
    }, [value, autoResize, minHeight, maxHeight]);

    // Update character count
    useEffect(() => {
      if (showCharCount && typeof value === 'string') {
        setCharCount(value.length);
      }
    }, [value, showCharCount]);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          className={cn(
            // Base styles - minimal, clean
            'w-full px-4 py-3 rounded-md border border-neutral-300',
            'bg-white text-neutral-950 placeholder:text-neutral-400',
            'text-base leading-relaxed',
            'resize-none', // Disable manual resize if auto-resize is enabled
            // Focus state - brand cyan accent
            'focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan',
            'transition-colors duration-200',
            // Disabled state
            'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed',
            // Error state
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: autoResize ? `${maxHeight}px` : undefined,
          }}
          {...props}
        />
        {/* Helper text, error, and character count */}
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex-1">
            {error && <p className="text-sm text-error">{error}</p>}
            {!error && helperText && (
              <p className="text-sm text-neutral-500">{helperText}</p>
            )}
          </div>
          {showCharCount && (
            <p
              className={cn(
                'text-sm',
                maxChars && charCount > maxChars
                  ? 'text-error font-medium'
                  : 'text-neutral-500'
              )}
            >
              {charCount}
              {maxChars && ` / ${maxChars}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
