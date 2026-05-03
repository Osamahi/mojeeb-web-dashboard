import type { ComponentType } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface MetricTileProps {
  label: string;
  value: string | number | null | undefined;
  /** Optional inline annotation rendered next to the value in a smaller,
   * muted style. Used for breakdowns like "5,000 (300 new)". */
  subtext?: string;
  icon: ComponentType<{ className?: string }>;
  isLoading?: boolean;
  variant?: 'default' | 'warning';
}

/**
 * Single-purpose KPI tile. Number + optional subtext + label + icon, no fluff.
 *
 * Pure presentational component — receives the value pre-computed. The
 * AgentAnalyticsPage owns the math (sums chart points to keep tiles + charts
 * aligned to the active window).
 */
export function MetricTile({
  label,
  value,
  subtext,
  icon: Icon,
  isLoading,
  variant = 'default',
}: MetricTileProps) {
  const isWarning = variant === 'warning';

  return (
    <div
      className={`bg-white border rounded-xl p-5 ${
        isWarning ? 'border-amber-300 bg-amber-50' : 'border-neutral-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p
          className={`text-sm font-medium leading-tight ${
            isWarning ? 'text-amber-700' : 'text-neutral-500'
          }`}
        >
          {label}
        </p>
        <Icon
          className={`h-5 w-5 flex-shrink-0 ${
            isWarning ? 'text-amber-500' : 'text-neutral-400'
          }`}
        />
      </div>
      {isLoading ? (
        <Skeleton className="h-9 w-24 rounded" />
      ) : (
        <p
          className={`text-3xl font-semibold tracking-tight ${
            isWarning ? 'text-amber-700' : 'text-neutral-900'
          }`}
        >
          {formatValue(value)}
          {subtext ? (
            <span className="ms-2 text-base font-normal text-neutral-500">
              {subtext}
            </span>
          ) : null}
        </p>
      )}
    </div>
  );
}

function formatValue(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  return v.toLocaleString();
}
