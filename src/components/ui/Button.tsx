/**
 * Mojeeb Minimal Button Component
 * Clean, professional buttons following Mojeeb brand guidelines
 * Variants: primary (cyan), secondary (outline), ghost (text-only)
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  // Base styles - minimal, clean, professional
  'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        // Primary - Brand Cyan (main CTA)
        primary:
          'bg-brand-cyan text-white hover:bg-brand-cyan/90 active:bg-brand-cyan/80',

        // Secondary - White with border (alternative action)
        secondary:
          'bg-white text-neutral-950 border border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100',

        // Ghost - Text only (minimal action)
        ghost:
          'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200',

        // Danger - For destructive actions
        danger:
          'bg-error text-white hover:bg-error/90 active:bg-error/80',
      },
      size: {
        sm: 'h-9 px-4 text-sm',     // 36px height
        md: 'h-10 px-6 text-base',  // 40px height
        lg: 'h-11 px-8 text-base',  // 44px height
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
