/**
 * Mojeeb Minimal Switch Component
 * Clean, accessible toggle switch following Mojeeb brand guidelines
 * Features: On/off states, focus states with brand cyan, keyboard accessible
 */

import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onChange, disabled, id, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          // Base container - pill shape
          'relative inline-flex h-6 w-11 items-center rounded-full',
          'transition-colors duration-200 ease-in-out',
          // Focus state - brand cyan ring
          'focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:ring-offset-2',
          // Background colors
          checked ? 'bg-brand-cyan' : 'bg-neutral-300',
          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer',
          className
        )}
      >
        {/* Hidden checkbox for form integration */}
        <input
          ref={ref}
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />

        {/* Sliding circle indicator */}
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm',
            'transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';
