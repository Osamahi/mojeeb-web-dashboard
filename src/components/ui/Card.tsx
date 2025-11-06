/**
 * Mojeeb Minimal Card Component
 * Clean, borderless container following minimal design principles
 * NO shadows, NO gradients - just white background with subtle border
 */

import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Makes card interactive with hover state (subtle border change) */
  hoverable?: boolean;
  /** Reduces padding for compact layouts */
  compact?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable, compact, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles - minimal, clean, white
          'bg-white rounded-lg border border-neutral-200',
          'transition-colors duration-200',
          // Padding
          compact ? 'p-4' : 'p-6',
          // Hoverable state - subtle border color change only
          hoverable && 'hover:border-neutral-300 cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
