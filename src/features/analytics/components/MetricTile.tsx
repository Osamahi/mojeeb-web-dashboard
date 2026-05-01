import type { ComponentType } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface MetricTileProps {
  label: string;
  value: string | number | null | undefined;
  icon: ComponentType<{ className?: string }>;
  isLoading?: boolean;
  variant?: 'default' | 'warning';
}

/**
 * Single-purpose KPI tile. Number + label + icon, no fluff.
 * Sourced exclusively from get_agent_live_summary RPC — no client-side math.
 */
export function MetricTile({
  label,
  value,
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
