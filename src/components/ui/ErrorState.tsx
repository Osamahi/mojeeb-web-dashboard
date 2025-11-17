import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
}

export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  ({ className, icon, title, description, onRetry, retryLabel = 'Try Again', action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center text-center', className)}
        {...props}
      >
        <div className="text-red-500">
          {icon || <AlertTriangle className="h-12 w-12" />}
        </div>

        <h3 className="mt-4 text-lg font-semibold text-neutral-900">
          {title}
        </h3>

        {description && (
          <p className="mt-2 text-sm text-neutral-600">
            {description}
          </p>
        )}

        {onRetry && (
          <Button onClick={onRetry} className="mt-4">
            {retryLabel}
          </Button>
        )}

        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
);

ErrorState.displayName = 'ErrorState';
