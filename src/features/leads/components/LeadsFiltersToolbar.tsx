/**
 * LeadsFiltersToolbar Component
 * Filter controls - memoized to prevent unnecessary re-renders
 * Only re-renders when filter values actually change
 */

import { memo } from 'react';
import { Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { FilterBadge } from './FilterBadge';
import { FilterPopover } from './FilterPopover';
import type { LeadStatus, LeadFilters, DatePreset } from '../types';

interface LeadsFiltersToolbarProps {
  // Current filter state
  filters: LeadFilters;
  searchInput: string;
  activeDatePreset: DatePreset | null;
  isFilterPopoverOpen: boolean;

  // Event handlers
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onStatusChange: (status: LeadStatus | 'all') => void;
  onFilterPopoverToggle: () => void;
  onFilterPopoverClose: () => void;
  onDateFilterApply: (preset: DatePreset, dateFrom?: string, dateTo?: string) => void;
  onClearFilters: () => void;
  onRemoveSearchFilter: () => void;
  onRemoveStatusFilter: () => void;
  onRemoveDateFilter: () => void;
}

export const LeadsFiltersToolbar = memo(({
  filters,
  searchInput,
  activeDatePreset,
  isFilterPopoverOpen,
  onSearchInputChange,
  onSearchSubmit,
  onSearchKeyPress,
  onStatusChange,
  onFilterPopoverToggle,
  onFilterPopoverClose,
  onDateFilterApply,
  onClearFilters,
  onRemoveSearchFilter,
  onRemoveStatusFilter,
  onRemoveDateFilter,
}: LeadsFiltersToolbarProps) => {
  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo;

  return (
    <div className="space-y-3">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input with Inline Button */}
        <div className="flex-1 min-w-[240px] relative">
          <Input
            placeholder="Search by name or phone..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyPress={onSearchKeyPress}
            className={`h-9 ${searchInput ? 'pr-24' : ''}`}
          />
          {searchInput && (
            <button
              onClick={onSearchSubmit}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 h-7 bg-black text-white rounded-md hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Search</span>
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <select
          value={filters.status}
          onChange={(e) => onStatusChange(e.target.value as LeadStatus | 'all')}
          className="px-3 h-9 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
        </select>

        {/* Add Filter Button */}
        <div className="relative">
          <button
            onClick={onFilterPopoverToggle}
            className={`
              px-3 h-9 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2
              ${isFilterPopoverOpen || filters.dateFrom || filters.dateTo
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }
            `}
          >
            <Calendar className="w-4 h-4" />
            {filters.dateFrom || filters.dateTo ? 'Date Filter' : 'Add Filter'}
          </button>

          {/* Filter Popover */}
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

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 h-9 text-sm text-neutral-600 hover:text-black transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <FilterBadge
              label="Search"
              value={filters.search}
              onRemove={onRemoveSearchFilter}
            />
          )}
          {filters.status !== 'all' && (
            <FilterBadge
              label="Status"
              value={filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
              onRemove={onRemoveStatusFilter}
            />
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <FilterBadge
              label="Date"
              value={
                activeDatePreset && activeDatePreset !== 'custom'
                  ? activeDatePreset === 'last7days'
                    ? 'Last 7 Days'
                    : activeDatePreset === 'last30days'
                    ? 'Last 30 Days'
                    : activeDatePreset === 'thisMonth'
                    ? 'This Month'
                    : activeDatePreset === 'today'
                    ? 'Today'
                    : `${filters.dateFrom || '...'} to ${filters.dateTo || '...'}`
                  : `${filters.dateFrom || '...'} to ${filters.dateTo || '...'}`
              }
              onRemove={onRemoveDateFilter}
            />
          )}
        </div>
      )}
    </div>
  );
});

LeadsFiltersToolbar.displayName = 'LeadsFiltersToolbar';
