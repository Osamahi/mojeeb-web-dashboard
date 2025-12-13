/**
 * LeadsFilterDrawer Component
 * Mobile-friendly filter drawer with smooth animations
 * Slides in from right on desktop, full-screen on mobile
 */

import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FilterPopover } from './FilterPopover';
import type { LeadStatus, LeadFilters, DatePreset } from '../types';

interface LeadsFilterDrawerProps {
  isOpen: boolean;
  filters: LeadFilters;
  searchInput: string;
  activeDatePreset: DatePreset | null;
  isFilterPopoverOpen: boolean;

  onClose: () => void;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onStatusChange: (status: LeadStatus | 'all') => void;
  onFilterPopoverToggle: () => void;
  onFilterPopoverClose: () => void;
  onDateFilterApply: (preset: DatePreset, dateFrom?: string, dateTo?: string) => void;
  onClearFilters: () => void;
  onApplyAndClose: () => void;
  onRemoveSearchFilter: () => void;
  onRemoveStatusFilter: () => void;
  onRemoveDateFilter: () => void;
}

export const LeadsFilterDrawer = memo(({
  isOpen,
  filters,
  searchInput,
  activeDatePreset,
  isFilterPopoverOpen,
  onClose,
  onSearchInputChange,
  onSearchSubmit,
  onSearchKeyPress,
  onStatusChange,
  onFilterPopoverToggle,
  onFilterPopoverClose,
  onDateFilterApply,
  onClearFilters,
  onApplyAndClose,
  onRemoveSearchFilter,
  onRemoveStatusFilter,
  onRemoveDateFilter,
}: LeadsFilterDrawerProps) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
                {hasActiveFilters && (
                  <p className="text-sm text-neutral-600 mt-0.5">
                    {[
                      filters.search && 'Search',
                      filters.status !== 'all' && 'Status',
                      (filters.dateFrom || filters.dateTo) && 'Date',
                    ].filter(Boolean).join(', ')} active
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Search Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900">
                  Search
                </label>
                <div className="relative">
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchInput}
                    onChange={(e) => onSearchInputChange(e.target.value)}
                    onKeyPress={onSearchKeyPress}
                    className="pr-10"
                  />
                  {searchInput && (
                    <button
                      onClick={onSearchSubmit}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-neutral-100 rounded transition-colors"
                    >
                      <Search className="w-4 h-4 text-neutral-600" />
                    </button>
                  )}
                </div>
                {searchInput && (
                  <p className="text-xs text-neutral-500">
                    Press Enter or click the search icon to apply
                  </p>
                )}
              </div>

              {/* Status Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'all', label: 'All Status' },
                    { value: 'new', label: 'New' },
                    { value: 'processing', label: 'Processing' },
                    { value: 'completed', label: 'Completed' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onStatusChange(option.value as LeadStatus | 'all')}
                      className={`
                        px-4 py-2.5 text-sm font-medium rounded-lg border transition-all
                        ${filters.status === option.value
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900">
                  Date Range
                </label>
                <div className="relative">
                  <button
                    onClick={onFilterPopoverToggle}
                    className={`
                      w-full px-4 py-2.5 text-sm font-medium rounded-lg border transition-all flex items-center justify-between
                      ${isFilterPopoverOpen || filters.dateFrom || filters.dateTo
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {filters.dateFrom || filters.dateTo
                        ? activeDatePreset && activeDatePreset !== 'custom'
                          ? activeDatePreset === 'last7days'
                            ? 'Last 7 Days'
                            : activeDatePreset === 'last30days'
                            ? 'Last 30 Days'
                            : activeDatePreset === 'thisMonth'
                            ? 'This Month'
                            : activeDatePreset === 'today'
                            ? 'Today'
                            : 'Custom Range'
                          : 'Custom Range'
                        : 'Select Date Range'
                      }
                    </span>
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
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="pt-4 border-t border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-neutral-900">Active Filters</span>
                    <button
                      onClick={onClearFilters}
                      className="text-xs text-neutral-600 hover:text-black transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2">
                    {filters.search && (
                      <div className="flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-lg group hover:bg-neutral-100 transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Search className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                          <span className="text-sm text-neutral-700 truncate">
                            Search: <span className="font-medium">{filters.search}</span>
                          </span>
                        </div>
                        <button
                          onClick={onRemoveSearchFilter}
                          className="p-1 hover:bg-neutral-200 rounded transition-colors ml-2 flex-shrink-0"
                          title="Remove search filter"
                        >
                          <X className="w-3.5 h-3.5 text-neutral-600" />
                        </button>
                      </div>
                    )}
                    {filters.status !== 'all' && (
                      <div className="flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-lg group hover:bg-neutral-100 transition-colors">
                        <span className="text-sm text-neutral-700 flex-1">
                          Status: <span className="font-medium">{filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}</span>
                        </span>
                        <button
                          onClick={onRemoveStatusFilter}
                          className="p-1 hover:bg-neutral-200 rounded transition-colors ml-2 flex-shrink-0"
                          title="Remove status filter"
                        >
                          <X className="w-3.5 h-3.5 text-neutral-600" />
                        </button>
                      </div>
                    )}
                    {(filters.dateFrom || filters.dateTo) && (
                      <div className="flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-lg group hover:bg-neutral-100 transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                          <span className="text-sm text-neutral-700 truncate">
                            {filters.dateFrom || '...'} to {filters.dateTo || '...'}
                          </span>
                        </div>
                        <button
                          onClick={onRemoveDateFilter}
                          className="p-1 hover:bg-neutral-200 rounded transition-colors ml-2 flex-shrink-0"
                          title="Remove date filter"
                        >
                          <X className="w-3.5 h-3.5 text-neutral-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 space-y-2">
              <Button
                onClick={onApplyAndClose}
                className="w-full"
              >
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="w-full px-4 py-2 text-sm text-neutral-600 hover:text-black transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

LeadsFilterDrawer.displayName = 'LeadsFilterDrawer';
