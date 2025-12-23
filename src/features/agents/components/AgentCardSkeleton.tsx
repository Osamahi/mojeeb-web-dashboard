/**
 * Mojeeb Agent Card Skeleton Component
 * Skeleton loading state for agent cards
 * Matches AgentCard structure for smooth loading experience
 */

import { Skeleton } from '@/components/ui/Skeleton';

export const AgentCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-3 sm:p-4">
      <div className="flex gap-3">
        {/* Content Area - Full width */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Skeleton height="20px" width="160px" className="sm:h-6" />
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <Skeleton width="28px" height="28px" className="rounded-md sm:w-8 sm:h-8" />
              <Skeleton width="28px" height="28px" className="rounded-md sm:w-8 sm:h-8" />
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1.5">
            <Skeleton height="14px" width="120px" />
            <Skeleton height="14px" width="120px" />
          </div>

          {/* Organization Display Skeleton (optional) */}
          <Skeleton height="14px" width="180px" />
        </div>
      </div>
    </div>
  );
};

/**
 * Multiple skeleton cards for loading state
 */
export const AgentListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <AgentCardSkeleton key={i} />
      ))}
    </div>
  );
};
