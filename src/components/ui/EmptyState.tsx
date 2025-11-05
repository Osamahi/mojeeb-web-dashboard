import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center py-16 px-4', className)}
        {...props}
      >
        <div className="mb-6 p-6 rounded-full bg-neutral-100">
          {icon || <Inbox className="w-12 h-12 text-neutral-400" />}
        </div>

        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          {title}
        </h3>

        {description && (
          <p className="text-neutral-600 text-center max-w-sm mb-6">
            {description}
          </p>
        )}

        {action && <div>{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
