import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  TIMESERIES_WINDOWS,
  type AnalyticsMetric,
  type MetricsTimeseries,
  type TimeseriesWindow,
} from '../types/analytics.types';

interface MetricsTimeseriesChartProps {
  data: MetricsTimeseries | undefined;
  metric: AnalyticsMetric;
  window: TimeseriesWindow;
  isLoading: boolean;
  isError: boolean;
  onMetricChange: (metric: AnalyticsMetric) => void;
  onWindowChange: (window: TimeseriesWindow) => void;
  onRetry?: () => void;
}

const METRICS: AnalyticsMetric[] = ['messages', 'sentiment', 'angry', 'actions'];
const WINDOWS: TimeseriesWindow[] = ['1h', '24h', '7d', '30d'];

export function MetricsTimeseriesChart({
  data,
  metric,
  window,
  isLoading,
  isError,
  onMetricChange,
  onWindowChange,
  onRetry,
}: MetricsTimeseriesChartProps) {
  const { t } = useTranslation();

  // Compute the time-axis domain from the WINDOW (not the data) so the chart
  // always reflects the requested window — e.g., 1h shows a full 60 min on
  // the X-axis even when only the last 5 min have data points.
  const { domainStart, domainEnd, ticks } = useMemo(() => {
    const config = TIMESERIES_WINDOWS[window];
    const end = Date.now();
    const start = end - config.fromOffsetMs;
    return {
      domainStart: start,
      domainEnd: end,
      ticks: buildTicks(start, end, window),
    };
  }, [window]);

  // Convert ISO strings to numeric timestamps so Recharts can plot them on a
  // fixed-domain time axis. Backend always sends Z-suffixed UTC strings
  // (per the AnalyticsRepository.ToIsoUtc helper), so new Date() parses them
  // unambiguously as UTC. Browser then renders in local time via the
  // tickFormatter and tooltip's toLocaleString.
  const chartData = useMemo(() => {
    if (!data?.points) return [];
    return data.points.map((point) => ({
      bucketAt: new Date(point.bucketAt).getTime(),
      value: point.value ?? 0,
    }));
  }, [data]);


  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-neutral-900">
          {t('analytics.timeseries_title')}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            value={metric}
            options={METRICS.map((m) => ({ value: m, label: t(`analytics.metric_${m}`) }))}
            onChange={(v) => onMetricChange(v as AnalyticsMetric)}
          />
          <SegmentedControl
            value={window}
            options={WINDOWS.map((w) => ({ value: w, label: t(`analytics.window_${w}`) }))}
            onChange={(v) => onWindowChange(v as TimeseriesWindow)}
          />
        </div>
      </div>

      {isError ? (
        <ErrorState
          title={t('analytics.error_loading_chart')}
          onRetry={onRetry}
        />
      ) : isLoading ? (
        <Skeleton className="h-72 w-full rounded-lg" />
      ) : (
        <div className="h-72 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
                allowDecimals={metric === 'sentiment'}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 12,
                }}
                labelFormatter={(ts: number) =>
                  new Date(ts).toLocaleString()
                }
                formatter={(value: number) => [
                  metric === 'sentiment' ? value.toFixed(2) : value.toLocaleString(),
                  t(`analytics.metric_${metric}`),
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#metricGradient)"
                isAnimationActive={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          {chartData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-neutral-400">
                {t('analytics.no_data_in_window')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SegmentedControlProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SegmentedControl({ value, options, onChange }: SegmentedControlProps) {
  return (
    <div className="inline-flex items-center bg-neutral-100 rounded-lg p-0.5">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function formatTick(ts: number, window: TimeseriesWindow): string {
  const d = new Date(ts);
  if (window === '1h' || window === '24h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (window === '7d') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Generates a small set of evenly-spaced X-axis tick timestamps spanning
 * [start, end]. Six ticks renders cleanly across all window sizes without
 * overlap or label crowding.
 */
function buildTicks(start: number, end: number, _window: TimeseriesWindow): number[] {
  const TICK_COUNT = 6;
  const span = end - start;
  if (span <= 0) return [start];
  const step = span / (TICK_COUNT - 1);
  return Array.from({ length: TICK_COUNT }, (_, i) => Math.round(start + step * i));
}
