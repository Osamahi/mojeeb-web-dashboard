/**
 * FilterBadge Component
 * Displays an active filter as a dismissible pill badge
 * Follows minimal design system
 */

import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FilterBadgeProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export function FilterBadge({ label, value, onRemove }: FilterBadgeProps) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded-md text-xs font-medium text-neutral-700">
      <span className="text-neutral-500">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 hover:bg-neutral-200 rounded p-0.5 transition-colors"
        aria-label={t('filter_badge.remove_filter', { label })}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
