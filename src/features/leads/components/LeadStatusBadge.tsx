/**
 * LeadStatusBadge Component
 * Displays lead status with color-coded minimal badge
 * Follows minimal design system (no gradients, minimal colors)
 */

import type { LeadStatus } from '../types';

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

// Status configuration with minimal colors
const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: {
    label: 'New',
    className: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
};

export default function LeadStatusBadge({ status, className = '' }: LeadStatusBadgeProps) {
  // Defensive: Handle unknown or undefined status values
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    className: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2.5 py-0.5
        text-xs font-medium
        rounded-md
        border
        ${config.className}
        ${className}
      `.trim()}
    >
      {config.label}
    </span>
  );
}
