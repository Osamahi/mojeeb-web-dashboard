/**
 * LeadsTableSkeleton Component
 * Minimal skeleton loader for leads table
 * Follows Chatbase-inspired minimal design system
 */

export function LeadsTableSkeleton() {
  // Generate 10 skeleton rows
  const rows = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="grid grid-cols-[1fr_1.5fr_0.8fr_0.6fr_0.8fr_auto] gap-4 px-6 py-3">
          <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-20 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-20 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse" />
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-neutral-200">
        {rows.map((i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1.5fr_0.8fr_0.6fr_0.8fr_auto] gap-4 px-6 py-4 hover:bg-neutral-50 transition-colors"
          >
            {/* Name column with avatar + text */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-200 animate-pulse flex-shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse" />
                <div className="h-3 bg-neutral-200 rounded w-32 animate-pulse" />
              </div>
            </div>

            {/* Summary column */}
            <div className="flex flex-col gap-2">
              <div className="h-3 bg-neutral-200 rounded w-full animate-pulse" />
              <div className="h-3 bg-neutral-200 rounded w-4/5 animate-pulse" />
            </div>

            {/* Status column */}
            <div className="flex items-center">
              <div className="h-7 bg-neutral-200 rounded w-24 animate-pulse" />
            </div>

            {/* Created column */}
            <div className="flex flex-col gap-1">
              <div className="h-3 bg-neutral-200 rounded w-20 animate-pulse" />
              <div className="h-3 bg-neutral-200 rounded w-16 animate-pulse" />
            </div>

            {/* Notes column */}
            <div className="flex items-center">
              <div className="h-3 bg-neutral-200 rounded w-32 animate-pulse" />
            </div>

            {/* Actions column */}
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 bg-neutral-200 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-neutral-200 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-neutral-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
