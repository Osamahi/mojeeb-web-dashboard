import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type UseQueryResult } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  TIMESERIES_WINDOWS,
  type MetricsTimeseries,
  type TimeseriesWindow,
} from '../types/analytics.types';

interface MetricChartProps {
  /** TanStack query result from any timeseries hook (useMetricsTimeseries,
   * useActiveConversations, useNewConversations, ...). The component is
   * source-agnostic — caller picks the hook. */
  query: UseQueryResult<MetricsTimeseries>;
  window: TimeseriesWindow;
  title: string;
  variant: 'bar' | 'line';
  color: string;
  /** True for sentiment — chart renders decimal values */
  decimal?: boolean;
}

/**
 * Single chart wired to a query result. Receives its window from the parent
 * so one page-level toggle drives every chart at once.
 *
 * Live updates are handled by the parent's useAnalyticsRealtime subscription
 * — when invalidation happens upstream, the query passed in here refetches
 * automatically.
 *
 * No client-side aggregation, no derived data — Recharts plots whatever the
 * backend hands us, on a fixed time-domain X-axis matching the requested
 * window.
 */
export function MetricChart({
  query,
  window,
  title,
  variant,
  color,
  decimal = false,
}: MetricChartProps) {
  const { t } = useTranslation();

  const { domainStart, domainEnd, ticks } = useMemo(() => {
    const config = TIMESERIES_WINDOWS[window];
    const end = Date.now();
    const start = end - config.fromOffsetMs;
    return { domainStart: start, domainEnd: end, ticks: buildTicks(start, end) };
  }, [window]);

  const chartData = useMemo(() => {
    if (!query.data?.points) return [];
    return query.data.points.map((p) => ({
      bucketAt: new Date(p.bucketAt).getTime(),
      value: p.value ?? 0,
    }));
  }, [query.data]);

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <h3 className="text-base font-semibold text-neutral-900 mb-4">{title}</h3>

      {query.isError ? (
        <ErrorState
          title={t('analytics.error_loading_chart')}
          onRetry={() => query.refetch()}
        />
      ) : query.isLoading ? (
        <Skeleton className="h-56 w-full rounded-lg" />
      ) : (
        <div className="h-56 relative">
          <ResponsiveContainer width="100%" height="100%">
            {variant === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="bucketAt"
                  type="number"
                  scale="time"
                  domain={[domainStart, domainEnd]}
                  ticks={ticks}
                  tickFormatter={(ts: number) => formatTick(ts, window)}
                  stroke="#9ca3af"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={11}
                  allowDecimals={decimal}
                  width={36}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(ts: number) => new Date(ts).toLocaleString()}
                  formatter={(value: number) => [
                    decimal ? value.toFixed(2) : value.toLocaleString(),
                    title,
                  ]}
                />
                <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="bucketAt"
                  type="number"
                  scale="time"
                  domain={[domainStart, domainEnd]}
                  ticks={ticks}
                  tickFormatter={(ts: number) => formatTick(ts, window)}
                  stroke="#9ca3af"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={11}
                  allowDecimals={decimal}
                  domain={decimal ? [1, 4] : ['auto', 'auto']}
                  ticks={decimal ? [1, 2, 3, 4] : undefined}
                  width={36}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(ts: number) => new Date(ts).toLocaleString()}
                  formatter={(value: number) => [
                    decimal ? value.toFixed(2) : value.toLocaleString(),
                    title,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
          {chartData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-neutral-400">{t('analytics.no_data_in_window')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontSize: 12,
};

function formatTick(ts: number, window: TimeseriesWindow): string {
  const d = new Date(ts);
  if (window === '1h' || window === '24h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function buildTicks(start: number, end: number): number[] {
  const TICK_COUNT = 6;
  const span = end - start;
  if (span <= 0) return [start];
  const step = span / (TICK_COUNT - 1);
  return Array.from({ length: TICK_COUNT }, (_, i) => Math.round(start + step * i));
}
