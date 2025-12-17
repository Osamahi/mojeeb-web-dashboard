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
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-neutral-900">Clients</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Manage your clients
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Filter Icon Button with Badge */}
        <button
          onClick={onFilterClick}
          className="relative w-10 h-10 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors flex items-center justify-center"
          title="Filters"
        >
          <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white text-xs font-semibold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Add Client Button */}
        <button
          onClick={onAddClick}
          className="px-4 h-10 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors flex items-center gap-2"
          title="Add Client"
        >
          <UserPlus className="w-4 h-4 text-neutral-700" />
          <span className="text-sm font-medium text-neutral-900">Add</span>
        </button>
      </div>
    </div>
  );
});

LeadsPageHeader.displayName = 'LeadsPageHeader';
