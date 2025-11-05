import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        {...props}
      >
        <Loader2 className={cn('animate-spin text-primary-500', sizeClasses[size])} />
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

// Full page spinner
export const PageSpinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-50/80 backdrop-blur-sm z-50">
      <Spinner size="lg" />
    </div>
  );
};
