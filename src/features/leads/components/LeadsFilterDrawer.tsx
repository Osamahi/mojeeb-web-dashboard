/**
 * LeadsFilterDrawer Component - V2 with Draft State
 * Mobile-friendly filter drawer with smooth animations
 * Uses internal draft state - filters only apply when user clicks "Apply"
 */

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FilterPopover } from './FilterPopover';
import type { LeadStatus, LeadFilters, DatePreset } from '../types';

interface LeadsFilterDrawerProps {
  isOpen: boolean;
  filters: LeadFilters; // Current applied filters
  onClose: () => void;
  onApplyFilters: (filters: LeadFilters) => void;
}

export const LeadsFilterDrawer = memo(({
  isOpen,
  filters,
  onClose,
  onApplyFilters,
}: LeadsFilterDrawerProps) => {
  // Draft state (internal to drawer, not applied until "Apply" clicked)
  const [draftSearch, setDraftSearch] = useState(filters.search || '');
  const [draftStatus, setDraftStatus] = useState<LeadStatus | 'all'>(filters.status);
  const [draftDateFrom, setDraftDateFrom] = useState<string | undefined>(filters.dateFrom);
  const [draftDateTo, setDraftDateTo] = useState<string | undefined>(filters.dateTo);
  const [draftDatePreset, setDraftDatePreset] = useState<DatePreset | null>(null);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  // Sync draft state with applied filters when drawer opens
  useEffect(() => {
    if (isOpen) {
      setDraftSearch(filters.search || '');
      setDraftStatus(filters.status);
      setDraftDateFrom(filters.dateFrom);
      setDraftDateTo(filters.dateTo);
    }
  }, [isOpen, filters]);

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

  const handleApply = () => {
    onApplyFilters({
      search: draftSearch.trim(),
      status: draftStatus,
      dateFrom: draftDateFrom,
      dateTo: draftDateTo,
    });
    onClose();
  };

  const handleClearAll = () => {
    setDraftSearch('');
    setDraftStatus('all');
    setDraftDateFrom(undefined);
    setDraftDateTo(undefined);
    setDraftDatePreset(null);
  };

  const handleDateFilterApply = (preset: DatePreset, dateFrom?: string, dateTo?: string) => {
    setDraftDatePreset(preset);
    setDraftDateFrom(dateFrom);
    setDraftDateTo(dateTo);
    setIsFilterPopoverOpen(false);
  };

  // Count active DRAFT filters
  const draftFilterCount = [
    draftSearch && 'search',
    draftStatus !== 'all' && 'status',
    (draftDateFrom || draftDateTo) && 'date',
  ].filter(Boolean).length;

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
                {draftFilterCount > 0 && (
                  <p className="text-sm text-neutral-600 mt-0.5">
                    {draftFilterCount} filter{draftFilterCount > 1 ? 's' : ''} selected
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
                <Input
                  placeholder="Search by name or phone..."
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleApply();
                    }
                  }}
                />
                <p className="text-xs text-neutral-500">
                  Press Enter or click "Apply Filters" to search
                </p>
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
                      onClick={() => setDraftStatus(option.value as LeadStatus | 'all')}
                      className={`
                        px-4 py-2.5 text-sm font-medium rounded-lg border transition-all
                        ${draftStatus === option.value
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
                    onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
                    className={`
                      w-full px-4 py-2.5 text-sm font-medium rounded-lg border transition-all flex items-center justify-between
                      ${isFilterPopoverOpen || draftDateFrom || draftDateTo
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {draftDateFrom || draftDateTo
                        ? draftDatePreset && draftDatePreset !== 'custom'
                          ? draftDatePreset === 'last7days'
                            ? 'Last 7 Days'
                            : draftDatePreset === 'last30days'
                            ? 'Last 30 Days'
                            : draftDatePreset === 'thisMonth'
                            ? 'This Month'
                            : draftDatePreset === 'today'
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
                      activePreset={draftDatePreset}
                      dateFrom={draftDateFrom}
                      dateTo={draftDateTo}
                      onApply={handleDateFilterApply}
                      onClose={() => setIsFilterPopoverOpen(false)}
                    />
                  )}
                </div>
              </div>

              {/* Active Filters Summary */}
              {draftFilterCount > 0 && (
                <div className="pt-4 border-t border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-neutral-900">Selected Filters</span>
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-neutral-600 hover:text-black transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2">
                    {draftSearch && (
                      <div className="flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-lg group hover:bg-neutral-100 transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Search className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                          <span className="text-sm text-neutral-700 truncate">
                            Search: <span className="font-medium">{draftSearch}</span>
                          </span>
                        </div>
                        <button
                          onClick={() => setDraftSearch('')}
                          className="p-1 hover:bg-neutral-200 rounded transition-colors ml-2 flex-shrink-0"
                          title="Remove search filter"
                        >
                          <X className="w-3.5 h-3.5 text-neutral-600" />
                        </button>
                      </div>
                    )}
                    {draftStatus !== 'all' && (
                      <div className="flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-lg group hover:bg-neutral-100 transition-colors">
                        <span className="text-sm text-neutral-700 flex-1">
                          Status: <span className="font-medium">{draftStatus.charAt(0).toUpperCase() + draftStatus.slice(1)}</span>
                        </span>
                        <button
                          onClick={() => setDraftStatus('all')}
                          className="p-1 hover:bg-neutral-200 rounded transition-colors ml-2 flex-shrink-0"
                          title="Remove status filter"
                        >
                          <X className="w-3.5 h-3.5 text-neutral-600" />
                        </button>
                      </div>
                    )}
                    {(draftDateFrom || draftDateTo) && (
                      <div className="flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-lg group hover:bg-neutral-100 transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                          <span className="text-sm text-neutral-700 truncate">
                            {draftDateFrom || '...'} to {draftDateTo || '...'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setDraftDateFrom(undefined);
                            setDraftDateTo(undefined);
                            setDraftDatePreset(null);
                          }}
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
              <Button onClick={handleApply} className="w-full">
                Apply Filters{draftFilterCount > 0 && ` (${draftFilterCount})`}
              </Button>
              {draftFilterCount > 0 && (
                <button
                  onClick={handleClearAll}
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
