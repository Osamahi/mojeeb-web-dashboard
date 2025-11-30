/**
 * Connection Status Badge Component
 * Displays connection status with appropriate styling
 * States: connected, available, coming_soon
 */

import { cn } from '@/lib/utils';

export type BadgeStatus = 'connected' | 'available' | 'coming_soon';

export interface ConnectionStatusBadgeProps {
  status: BadgeStatus;
  className?: string;
  showDot?: boolean;
}

const statusConfig = {
  connected: {
    label: 'Connected',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    dotColor: 'bg-green-500',
  },
  available: {
    label: 'Available',
    bgColor: 'bg-neutral-50',
    textColor: 'text-neutral-700',
    borderColor: 'border-neutral-200',
    dotColor: 'bg-neutral-500',
  },
  coming_soon: {
    label: 'Coming Soon',
    bgColor: 'bg-neutral-100',
    textColor: 'text-neutral-600',
    borderColor: 'border-neutral-200',
    dotColor: 'bg-neutral-400',
  },
};

export function ConnectionStatusBadge({
  status,
  className,
  showDot = true,
}: ConnectionStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
    >
      {showDot && (
        <div className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      )}
      {config.label}
    </span>
  );
}
