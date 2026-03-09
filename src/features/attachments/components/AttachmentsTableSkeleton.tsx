/**
 * Skeleton loader for attachments table
 */

export function AttachmentsTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-neutral-200 p-4 animate-pulse"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 bg-neutral-200 rounded w-40"></div>
                <div className="h-5 bg-neutral-200 rounded-full w-20"></div>
              </div>
              <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              <div className="flex items-center gap-4">
                <div className="h-4 bg-neutral-200 rounded w-24"></div>
                <div className="h-4 bg-neutral-200 rounded w-32"></div>
              </div>
            </div>
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
