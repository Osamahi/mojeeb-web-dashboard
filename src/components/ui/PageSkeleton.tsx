/**
 * PageSkeleton Component
 * Minimal skeleton shown during lazy page loading
 * Replaces full-screen spinner with content-aware skeleton
 */

export const PageSkeleton = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-neutral-200 rounded w-32" />
          <div className="h-4 bg-neutral-200 rounded w-64" />
        </div>
        <div className="h-10 bg-neutral-200 rounded w-32" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        {/* Toolbar/Filter Area */}
        <div className="flex items-center gap-2">
          <div className="h-9 bg-neutral-200 rounded flex-1 min-w-[240px]" />
          <div className="h-9 bg-neutral-200 rounded w-32" />
          <div className="h-9 bg-neutral-200 rounded w-28" />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-full" />
          <div className="h-4 bg-neutral-200 rounded w-5/6" />
          <div className="h-4 bg-neutral-200 rounded w-4/6" />
          <div className="h-4 bg-neutral-200 rounded w-full" />
          <div className="h-4 bg-neutral-200 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
};
