/**
 * Agents Page Header
 * Header with filter button (SuperAdmin only) and create agent action
 * Shows active filter count badge
 */

import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AgentsPageHeaderProps {
  activeFilterCount: number;
  onFilterClick: () => void;
  onCreateClick: () => void;
  isSuperAdmin: boolean; // Filter button only visible to SuperAdmin
}

export default function AgentsPageHeader({
  activeFilterCount,
  onFilterClick,
  onCreateClick,
  isSuperAdmin,
}: AgentsPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Title Section */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950">AI Agents</h1>
        <p className="text-sm sm:text-base text-neutral-600 mt-1">
          Manage your intelligent AI assistants
        </p>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Filter Button with Badge - SuperAdmin Only */}
        {isSuperAdmin && (
          <button
            onClick={onFilterClick}
            className="relative p-2 sm:px-4 sm:py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
            title="Filter agents"
          >
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600" />
            <span className="hidden sm:inline text-sm font-medium text-neutral-700">
              Filters
            </span>
            {/* Active Filter Count Badge */}
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0 w-5 h-5 bg-brand-cyan text-white text-xs font-semibold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Create Agent Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={onCreateClick}
          className="h-10 w-10 p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
        >
          <Plus className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">Create Agent</span>
        </Button>
      </div>
    </div>
  );
}
