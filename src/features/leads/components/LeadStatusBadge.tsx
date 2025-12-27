/**
 * LeadStatusBadge Component
 * Displays lead status with color-coded minimal badge
 * Follows minimal design system (no gradients, minimal colors)
 */

import { useTranslation } from 'react-i18next';
import type { LeadStatus } from '../types';

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

// Status configuration with minimal colors (labels now use translations)
const getStatusConfig = (t: (key: string) => string): Record<LeadStatus, { label: string; className: string }> => ({
  new: {
    label: t('leads.status_new'),
    className: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  },
  processing: {
    label: t('leads.status_processing'),
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  completed: {
    label: t('leads.status_completed'),
    className: 'bg-green-50 text-green-700 border-green-200',
  },
});

export default function LeadStatusBadge({ status, className = '' }: LeadStatusBadgeProps) {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(t);

  // Defensive: Handle unknown or undefined status values
  const config = statusConfig[status] || {
    label: status || t('leads.status_unknown'),
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
