import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Frown, Smile, Workflow } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { MetricTile } from '../components/MetricTile';
import { MetricChart } from '../components/MetricChart';
import { useMetricsTimeseries } from '../hooks/useMetricsTimeseries';
import { useAnalyticsRealtime } from '../hooks/useAnalyticsRealtime';
import type {
  MetricsTimeseries,
  TimeseriesWindow,
} from '../types/analytics.types';

const WINDOWS: TimeseriesWindow[] = ['1h', '24h', '7d', '30d'];

/**
 * Live per-agent analytics dashboard.
 *
 * Layout:
 *   - Page header with shared time-window toggle (1h/24h/7d/30d)
 *   - Four KPI tiles (today's totals from get_agent_live_summary)
 *   - Four time-series charts (one per metric, all reacting to the
 *     shared window)
 *
 * Data source: ONLY agent_live_metrics + agent_action_metrics via existing
 * RPCs. Zero client-side aggregation. Live updates via useAnalyticsRealtime.
 */
export default function AgentAnalyticsPage() {
  const { t } = useTranslation();
  const { agentId, isAgentSelected } = useAgentContext();
  useDocumentTitle(t('analytics.page_title'));

  // Wire up Realtime — invalidates all analytics queries on counter changes.
  useAnalyticsRealtime(agentId);

  // Single page-level window selector — all charts react.
  const [window, setWindow] = useState<TimeseriesWindow>('24h');

  // Tile values come from the SAME timeseries data the charts render — we
  // just sum the points client-side. This guarantees tiles and charts always
  // agree (impossible to drift) and the totals reflect the active window
  // (1h tile = last hour, 24h tile = last 24h, etc.) instead of "today since
  // UTC midnight" which had a timezone mismatch issue.
  const messagesQuery   = useMetricsTimeseries(agentId, 'messages',  window);
  const actionsQuery    = useMetricsTimeseries(agentId, 'actions',   window);
  const angryQuery      = useMetricsTimeseries(agentId, 'angry',     window);
  const sentimentQuery  = useMetricsTimeseries(agentId, 'sentiment', window);

  const messagesTotal  = useMemo(() => sumPoints(messagesQuery.data),  [messagesQuery.data]);
  const actionsTotal   = useMemo(() => sumPoints(actionsQuery.data),   [actionsQuery.data]);
  const angryTotal     = useMemo(() => sumPoints(angryQuery.data),     [angryQuery.data]);
  const satisfactionAvg = useMemo(() => avgPoints(sentimentQuery.data), [sentimentQuery.data]);

  const tilesLoading = messagesQuery.isLoading || actionsQuery.isLoading
    || angryQuery.isLoading || sentimentQuery.isLoading;

  if (!isAgentSelected) {
    return (
      <div className="p-6 space-y-6">
        <BaseHeader
          title={t('analytics.page_title')}
          subtitle={t('analytics.page_subtitle')}
        />
        <EmptyState
          title={t('analytics.no_agent_selected')}
          description={t('analytics.no_agent_selected_hint')}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header + window toggle */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <BaseHeader
          title={t('analytics.page_title')}
          subtitle={t('analytics.page_subtitle')}
        />
        <WindowToggle value={window} onChange={setWindow} />
      </div>

      {/* KPI tiles — values are summed from the same timeseries the charts render,
          so tile totals always match the active window and the chart contents. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label={t('analytics.tile_messages')}
          value={messagesTotal}
          icon={MessageSquare}
          isLoading={tilesLoading}
        />
        <MetricTile
          label={t('analytics.tile_satisfaction')}
          value={satisfactionAvg !== null ? satisfactionAvg.toFixed(2) : null}
          icon={Smile}
          isLoading={tilesLoading}
        />
        <MetricTile
          label={t('analytics.tile_actions')}
          value={actionsTotal}
          icon={Workflow}
          isLoading={tilesLoading}
        />
        <MetricTile
          label={t('analytics.tile_angry')}
          value={angryTotal}
          icon={Frown}
          isLoading={tilesLoading}
          variant={angryTotal > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Charts — stacked, page-level window controls all three.
          Satisfaction has its own tile but no chart — a line chart of a
          bounded 1-4 score on a sparse window adds little signal. */}
      <div className="space-y-4">
        <MetricChart
          agentId={agentId}
          metric="messages"
          window={window}
          title={t('analytics.chart_messages')}
          variant="bar"
          color="#3b82f6"
        />
        <MetricChart
          agentId={agentId}
          metric="actions"
          window={window}
          title={t('analytics.chart_actions')}
          variant="bar"
          color="#8b5cf6"
        />
        <MetricChart
          agentId={agentId}
          metric="angry"
          window={window}
          title={t('analytics.chart_angry')}
          variant="bar"
          color="#f59e0b"
        />
      </div>
    </div>
  );
}

interface WindowToggleProps {
  value: TimeseriesWindow;
  onChange: (window: TimeseriesWindow) => void;
}

function WindowToggle({ value, onChange }: WindowToggleProps) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center bg-neutral-100 rounded-lg p-0.5">
      {WINDOWS.map((w) => {
        const isActive = w === value;
        return (
          <button
            key={w}
            type="button"
            onClick={() => onChange(w)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t(`analytics.window_${w}`)}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Tile aggregation helpers
// ----------------------------------------------------------------------------
// Tile values come from summing the same timeseries data the charts render.
// Guarantees tiles match charts exactly, and totals reflect the active window
// (1h tile = last hour, 24h tile = last 24h) instead of "today since UTC midnight".
// ============================================================================

function sumPoints(data: MetricsTimeseries | undefined): number {
  if (!data?.points) return 0;
  return data.points.reduce((acc, p) => acc + (p.value ?? 0), 0);
}

/**
 * Average for the satisfaction tile. The sentiment timeseries returns
 * already-averaged values per bucket (sum/count from the RPC), so the tile
 * shows the mean of those bucket-averages — a simple and consistent reading.
 * Returns null when no data so the tile renders an em-dash.
 */
function avgPoints(data: MetricsTimeseries | undefined): number | null {
  if (!data?.points || data.points.length === 0) return null;
  const valid = data.points.filter((p) => p.value !== null && p.value !== undefined);
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, p) => acc + (p.value as number), 0);
  return sum / valid.length;
}
