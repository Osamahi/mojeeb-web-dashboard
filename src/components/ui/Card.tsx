import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass, hoverable, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl p-6 transition-all duration-300',
          glass
            ? 'glass border border-neutral-200/50 shadow-glass'
            : 'bg-white border border-neutral-200 shadow-sm',
          hoverable && 'hover:shadow-float hover:scale-[1.01] cursor-pointer',
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
