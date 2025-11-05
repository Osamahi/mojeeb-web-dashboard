/**
 * Mojeeb Minimal Badge Component
 * Clean pill-shaped badges using Mojeeb brand colors
 * Variants: default, primary (cyan), success (green), warning, danger
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
        primary: 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20',
        success: 'bg-brand-green/10 text-brand-green border border-brand-green/20',
        warning: 'bg-warning/10 text-warning border border-warning/20',
        danger: 'bg-error/10 text-error border border-error/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    );
  }
);

Badge.displayName = 'Badge';
