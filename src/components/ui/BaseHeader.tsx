/**
 * BaseHeader Component
 *
 * Centralized page header component for consistent design across the dashboard.
 *
 * Features:
 * - Memoized to prevent unnecessary re-renders
 * - Flexible action button support
 * - Optional filter button with active count badge
 * - Clean minimal design following Mojeeb design system
 *
 * Reference: LeadsPageHeader.tsx (optimal pattern)
 *
 * @example
 * ```tsx
 * <BaseHeader
 *   title="Clients"
 *   subtitle="Manage your clients"
 *   showFilterButton
 *   activeFilterCount={3}
 *   onFilterClick={handleFilter}
 *   primaryAction={{
 *     label: "Add",
 *     icon: UserPlus,
 *     onClick: handleAdd
 *   }}
 * />
 * ```
 */

import { memo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface BaseHeaderProps {
  // Title Section
  /** Page title (H1) */
  title: string;
  /** Optional subtitle/description text */
  subtitle?: string;
  /** Optional badge to display next to title */
  badge?: React.ReactNode;

  // Filter Button (optional)
  /** Show filter button with badge */
  showFilterButton?: boolean;
  /** Number of active filters (0 hides badge) */
  activeFilterCount?: number;
  /** Filter button click handler */
  onFilterClick?: () => void;

  // Primary Action Button (optional)
  /** Primary action button configuration */
  primaryAction?: {
    /** Button label text */
    label: string;
    /** Lucide icon component */
    icon: React.ComponentType<{ className?: string }>;
    /** Click handler */
    onClick: () => void;
  };

  // Custom Actions Slot (optional)
  /** Additional custom action buttons or elements */
  additionalActions?: React.ReactNode;
}

/**
 * BaseHeader Component
 *
 * Standardized page header with title, subtitle, and optional action buttons.
 * Memoized for performance - use stable callback references (useCallback).
 */
export const BaseHeader = memo(({
  title,
  subtitle,
  badge,
  showFilterButton = false,
  activeFilterCount = 0,
  onFilterClick,
  primaryAction,
  additionalActions,
}: BaseHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-4">
      {/* Title Section */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Actions Section */}
      {(showFilterButton || primaryAction || additionalActions) && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Filter Icon Button with Badge */}
          {showFilterButton && onFilterClick && (
            <button
              onClick={onFilterClick}
              className="relative w-10 h-10 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors flex items-center justify-center"
              title={useTranslation().t('common.filters')}
            >
              <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white text-xs font-semibold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Primary Action Button */}
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="px-4 h-10 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors flex items-center gap-2"
              title={primaryAction.label}
            >
              <primaryAction.icon className="w-4 h-4 text-neutral-700" />
              <span className="text-sm font-medium text-neutral-900">
                {primaryAction.label}
              </span>
            </button>
          )}

          {/* Additional Custom Actions */}
          {additionalActions}
        </div>
      )}
    </div>
  );
});

BaseHeader.displayName = 'BaseHeader';
