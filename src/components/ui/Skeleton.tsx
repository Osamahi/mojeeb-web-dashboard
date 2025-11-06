/**
 * Mojeeb Minimal Skeleton Component
 * Clean loading skeleton with shimmer effect
 * Used for loading states throughout the dashboard
 */

import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Width of skeleton (supports tailwind classes or custom values) */
  width?: string;
  /** Height of skeleton (supports tailwind classes or custom values) */
  height?: string;
  /** Makes skeleton circular (for avatars) */
  circle?: boolean;
  /** Number of skeleton lines to display */
  count?: number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, circle, count = 1, ...props }, ref) => {
    const baseClasses = cn(
      'bg-neutral-100 rounded animate-shimmer',
      circle && 'rounded-full',
      className
    );

    const style = {
      width: width,
      height: height || (circle ? width : undefined),
    };

    if (count > 1) {
      return (
        <div ref={ref} className="space-y-2">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className={baseClasses}
              style={style}
              {...props}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={baseClasses}
        style={style}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Pre-built skeleton patterns for common UI elements
 */
export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="16px"
        width={i === lines - 1 ? '80%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="bg-white rounded-lg border border-neutral-200 p-6">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton circle width="48px" />
      <div className="flex-1">
        <Skeleton height="20px" width="40%" className="mb-2" />
        <Skeleton height="16px" width="60%" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonButton = () => (
  <Skeleton height="40px" width="120px" className="rounded-md" />
);

export const SkeletonInput = () => (
  <Skeleton height="40px" className="rounded-md" />
);
