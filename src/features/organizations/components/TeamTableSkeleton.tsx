/**
 * TeamTableSkeleton Component
 * Minimal skeleton loader for team members table
 * Follows Chatbase-inspired minimal design system
 */

export function TeamTableSkeleton() {
  // Generate 8 skeleton rows
  const rows = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr_0.8fr_auto] gap-4 px-6 py-3">
          <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-12 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse" />
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-neutral-200">
        {rows.map((i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr_0.8fr_auto] gap-4 px-6 py-4 hover:bg-neutral-50 transition-colors"
          >
            {/* User column */}
            <div className="flex items-center">
              <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse" />
            </div>

            {/* Email column */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 bg-neutral-200 rounded w-40 animate-pulse" />
            </div>

            {/* Phone column */}
            <div className="flex items-center">
              <div className="h-4 bg-neutral-200 rounded w-28 animate-pulse" />
            </div>

            {/* Role column */}
            <div className="flex items-center">
              <div className="h-6 bg-neutral-200 rounded-full w-20 animate-pulse" />
            </div>

            {/* Joined column */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse" />
            </div>

            {/* Actions column */}
            <div className="flex items-center justify-end">
              <div className="w-8 h-8 bg-neutral-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
