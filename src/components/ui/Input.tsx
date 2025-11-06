/**
 * Mojeeb Minimal Input Component
 * Clean, accessible input fields following Mojeeb brand guidelines
 * Features: Label, error states, focus states with brand cyan
 */

import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            // Base styles - minimal, clean
            'w-full h-10 px-4 rounded-md border border-neutral-300',
            'bg-white text-neutral-950 placeholder:text-neutral-400',
            'text-base',
            // Focus state - brand cyan accent
            'focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan',
            'transition-colors duration-200',
            // Disabled state
            'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed',
            // Error state
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
