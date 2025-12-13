/**
 * LeadsPageHeader Component
 * Static header component - memoized to prevent re-renders
 * Includes filter button with active filter count badge
 */

import { memo } from 'react';
import { UserPlus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LeadsPageHeaderProps {
  activeFilterCount: number;
  onAddClick: () => void;
  onFilterClick: () => void;
}

export const LeadsPageHeader = memo(({ activeFilterCount, onAddClick, onFilterClick }: LeadsPageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Leads</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Manage and track your leads for this agent
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Filter Button with Badge */}
        <button
          onClick={onFilterClick}
          className="relative px-4 h-10 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
          <span className="text-sm font-medium text-neutral-900">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white text-xs font-semibold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Add Lead Button */}
        <Button onClick={onAddClick}>
          <UserPlus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Add Lead</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </div>
  );
});

LeadsPageHeader.displayName = 'LeadsPageHeader';
