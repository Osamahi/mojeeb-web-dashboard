/**
 * Filter drawer for actions list
 * Slides in from right with filter options
 */

import { X } from 'lucide-react';
import { useCallback } from 'react';
import type { ActionFilters } from '../types';
import { actionTypeOptions } from '../utils/validation';

interface ActionsFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ActionFilters;
  onFiltersChange: (filters: ActionFilters) => void;
}

export function ActionsFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: ActionsFilterDrawerProps) {
  const handleActionTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      onFiltersChange({
        ...filters,
        actionType: value ? (value as any) : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleIsActiveChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      onFiltersChange({
        ...filters,
        isActive: value === '' ? undefined : value === 'true',
      });
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Action Type Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Action Type
            </label>
            <select
              value={filters.actionType || ''}
              onChange={handleActionTypeChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {actionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Status
            </label>
            <select
              value={
                filters.isActive === undefined
                  ? ''
                  : filters.isActive
                    ? 'true'
                    : 'false'
              }
              onChange={handleIsActiveChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 flex gap-2">
          <button
            onClick={handleClearFilters}
            className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
