/**
 * Skeleton loader for actions table
 */

export function ActionsTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-neutral-200 p-4 animate-pulse"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Name + Type Badge */}
              <div className="flex items-center gap-2">
                <div className="h-5 bg-neutral-200 rounded w-40"></div>
                <div className="h-5 bg-neutral-200 rounded-full w-20"></div>
              </div>

              {/* Description */}
              <div className="h-4 bg-neutral-200 rounded w-3/4"></div>

              {/* Trigger Prompt */}
              <div className="h-4 bg-neutral-200 rounded w-full"></div>

              {/* Meta info */}
              <div className="flex items-center gap-4">
                <div className="h-4 bg-neutral-200 rounded w-24"></div>
                <div className="h-4 bg-neutral-200 rounded w-32"></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-neutral-200 rounded"></div>
              <div className="h-8 w-8 bg-neutral-200 rounded"></div>
              <div className="h-8 w-8 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
