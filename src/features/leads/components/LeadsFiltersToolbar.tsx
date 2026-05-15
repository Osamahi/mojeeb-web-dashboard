/**
 * LeadsFiltersToolbar
 *
 * Filter strip rendered above the leads table. Mirrors the
 * AdminSubscriptionsPage filter UX: debounced search left, status dropdown
 * and date popover right, active-filter pills underneath.
 *
 * The parent owns filter state + the search debounce — this component is a
 * pure controlled view, memoized so unrelated parent re-renders don't shake
 * the table.
 */

import { memo } from 'react';
import { Search, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FilterPopover } from './FilterPopover';
import { LeadStatusDropdown } from './LeadStatusDropdown';
import { AssigneeDropdown } from './AssigneeDropdown';
import type { LeadStatus, LeadFilters, DatePreset, AssigneeFilter } from '../types/lead.types';

/**
 * Temporary feature flag — hides the Assignee filter without removing any
 * of the supporting code (dropdown component, handler, types). Flip back
 * to `true` to re-enable the filter. Keep in sync with
 * SHOW_ASSIGNEE_COLUMN in useLeadTableColumns.tsx.
 */
const SHOW_ASSIGNEE_FILTER = false;

interface LeadsFiltersToolbarProps {
  filters: LeadFilters;
  /** Debounced search value the parent is currently holding. */
  searchInput: string;
  activeDatePreset: DatePreset | null;
  isFilterPopoverOpen: boolean;

  onSearchInputChange: (value: string) => void;
  onStatusChange: (status: LeadStatus | 'all') => void;
  onAssigneeChange: (next: AssigneeFilter | 'all') => void;
  onFilterPopoverToggle: () => void;
  onFilterPopoverClose: () => void;
  onDateFilterApply: (preset: DatePreset, dateFrom?: string, dateTo?: string) => void;
  onClearFilters: () => void;
}

export const LeadsFiltersToolbar = memo(({
  filters,
  searchInput,
  activeDatePreset,
  isFilterPopoverOpen,
  onSearchInputChange,
  onStatusChange,
  onAssigneeChange,
  onFilterPopoverToggle,
  onFilterPopoverClose,
  onDateFilterApply,
  onClearFilters,
}: LeadsFiltersToolbarProps) => {
  const { t } = useTranslation();
  const hasActiveFilters =
    !!filters.search ||
    filters.status !== 'all' ||
    !!filters.dateFrom ||
    !!filters.dateTo ||
    !!filters.assignedTo;
  const hasDateFilter = !!filters.dateFrom || !!filters.dateTo;

  return (
    <div className="space-y-3">
      {/* Search left, filter controls right — same shape as AdminSubscriptionsPage. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('leads.search_placeholder')}
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2 ltr:pl-10 ltr:pr-3 rtl:pr-10 rtl:pl-3 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          {/* Same styled dropdown as the row-level status picker, with an
              "All statuses" option enabled via `allowAll`. */}
          <LeadStatusDropdown
            status={filters.status}
            onChange={onStatusChange}
            allowAll
            bordered
          />

          {/* Assignee filter — mirrors the row-level picker; uses filter mode
              so it can hold the "me" / "unassigned" / "all" tokens too.
              Gated by SHOW_ASSIGNEE_FILTER while the assignee feature is
              hidden from the UI; the underlying state + types stay wired. */}
          {SHOW_ASSIGNEE_FILTER && (
            <AssigneeDropdown
              mode="filter"
              value={filters.assignedTo ?? 'all'}
              onChange={onAssigneeChange}
              bordered
            />
          )}

          {/* Date filter popover */}
          <div className="relative">
            <button
              onClick={onFilterPopoverToggle}
              className={`
                inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors
                ${isFilterPopoverOpen || hasDateFilter
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <Calendar className="h-4 w-4" />
              {hasDateFilter ? t('leads.date_filter') : t('leads.add_filter')}
            </button>

            {isFilterPopoverOpen && (
              <FilterPopover
                activePreset={activeDatePreset}
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
                onApply={onDateFilterApply}
                onClose={onFilterPopoverClose}
              />
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-black transition-colors"
            >
              {t('common.clear_filters')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

LeadsFiltersToolbar.displayName = 'LeadsFiltersToolbar';
