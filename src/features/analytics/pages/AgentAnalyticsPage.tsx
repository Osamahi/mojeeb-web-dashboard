import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Frown, Smile, Workflow, Users } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { MetricTile } from '../components/MetricTile';
import { MetricChart } from '../components/MetricChart';
import { useMetricsTimeseries } from '../hooks/useMetricsTimeseries';
import { useActiveConversations } from '../hooks/useActiveConversations';
import { useActiveConversationsCount } from '../hooks/useActiveConversationsCount';
import { useNewConversations } from '../hooks/useNewConversations';
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
 *   - 5 KPI tiles: Active Conversations (with new-count subtext),
 *     Total Messages, Satisfaction, Actions, Angry
 *   - 4 time-series charts: Active, Messages, Actions, Angry — all driven
 *     by the shared window selector
 *
 * Data sources (all via Postgres RPCs):
 *   - chats                  → active conversations (via index-only scan)
 *   - conversations          → new conversations
 *   - agent_live_metrics     → messages, sentiment, angry
 *   - agent_action_metrics   → actions
 *
 * Aggregation rule: tiles read `data.total` from the RPC envelope (computed
 * in SQL via CTE-shared scans — see migration 088). The exception is
 * sentiment, whose `total` is intentionally null because avg-of-bucket-
 * averages is wrong (Simpson's paradox); a weighted-average scalar RPC is
 * deferred. Active uses a dedicated scalar RPC because COUNT(DISTINCT)
 * isn't composable from per-bucket distinct counts.
 *
 * Live updates: useAnalyticsRealtime invalidates the analytics query-key
 * prefix on counter-table changes; all 7 hooks refetch in parallel.
 */
export default function AgentAnalyticsPage() {
  const { t } = useTranslation();
  const { agentId, isAgentSelected } = useAgentContext();
  useDocumentTitle(t('analytics.page_title'));

  // Wire up Realtime — invalidates all analytics queries on counter changes.
  useAnalyticsRealtime(agentId);

  // Single page-level window selector — all charts react.
  const [window, setWindow] = useState<TimeseriesWindow>('24h');

  const messagesQuery   = useMetricsTimeseries(agentId, 'messages',  window);
  const actionsQuery    = useMetricsTimeseries(agentId, 'actions',   window);
  const angryQuery      = useMetricsTimeseries(agentId, 'angry',     window);
  const sentimentQuery  = useMetricsTimeseries(agentId, 'sentiment', window);
  const activeQuery       = useActiveConversations(agentId, window);
  const activeCountQuery  = useActiveConversationsCount(agentId, window);
  const newConvsQuery     = useNewConversations(agentId, window);

  // Tile values come from the backend's `total` field (computed in SQL —
  // see migration 088). No frontend aggregation: SUM/COUNT done in one
  // CTE-shared scan with the bucket points, so tile and chart can't drift.
  const messagesTotal = messagesQuery.data?.total ?? 0;
  const actionsTotal  = actionsQuery.data?.total  ?? 0;
  const angryTotal    = angryQuery.data?.total    ?? 0;
  // Active Conversations: dedicated scalar RPC because COUNT(DISTINCT) isn't
  // composable from per-bucket distinct counts (the same conversation across
  // multiple buckets must be counted once overall, not N times).
  const activeCount   = activeCountQuery.data?.total ?? 0;
  // New Conversations subtext: backend total = COUNT(*) over window.
  const newCount      = newConvsQuery.data?.total ?? 0;
  // Sentiment: backend `total` is intentionally null (avg-of-bucket-averages
  // is wrong; weighted average needs a separate scalar RPC — deferred).
  // Falls back to mean of bucket-averages until that's built.
  const satisfactionAvg = useMemo(() => avgPoints(sentimentQuery.data), [sentimentQuery.data]);

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

      {/* KPI tiles — values are derived from the same timeseries the charts render,
          so tiles always match the active window. Per-tile isLoading so a slow
          query doesn't flicker the others. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricTile
          label={t('analytics.tile_active')}
          value={activeCount}
          subtext={t('analytics.tile_active_new_subtext', { count: newCount })}
          icon={Users}
          isLoading={activeCountQuery.isLoading || newConvsQuery.isLoading}
        />
        <MetricTile
          label={t('analytics.tile_messages')}
          value={messagesTotal}
          icon={MessageSquare}
          isLoading={messagesQuery.isLoading}
        />
        <MetricTile
          label={t('analytics.tile_satisfaction')}
          value={satisfactionAvg !== null ? `${satisfactionAvg.toFixed(2)} / 5` : null}
          icon={Smile}
          isLoading={sentimentQuery.isLoading}
        />
        <MetricTile
          label={t('analytics.tile_actions')}
          value={actionsTotal}
          icon={Workflow}
          isLoading={actionsQuery.isLoading}
        />
        <MetricTile
          label={t('analytics.tile_angry')}
          value={angryTotal}
          icon={Frown}
          isLoading={angryQuery.isLoading}
          variant={angryTotal > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Charts — stacked, page-level window controls them all.
          - Active Customers: shown as chart (engagement trend matters most).
          - New Customers: tile only — count by window is enough; the trend
            is implicit in the Active chart's growth.
          - Satisfaction: tile only — a line chart of a bounded 1-5 score
            on a sparse window adds little signal. */}
      <div className="space-y-4">
        <MetricChart
          query={activeQuery}
          window={window}
          title={t('analytics.chart_active')}
          variant="bar"
          color="#10b981"
        />
        <MetricChart
          query={messagesQuery}
          window={window}
          title={t('analytics.chart_messages')}
          variant="bar"
          color="#3b82f6"
        />
        <MetricChart
          query={actionsQuery}
          window={window}
          title={t('analytics.chart_actions')}
          variant="bar"
          color="#8b5cf6"
        />
        <MetricChart
          query={angryQuery}
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
// Sentiment fallback helper
// ----------------------------------------------------------------------------
// All other tile values come from the backend's `total` field (computed in
// SQL). Sentiment is the exception — its `total` is intentionally null
// because avg-of-bucket-averages is mathematically wrong (Simpson's paradox).
// Until a separate weighted-average scalar RPC is built, we fall back to
// mean-of-bucket-averages here. Slightly biased toward sparse buckets, but
// good enough as a placeholder.
// ============================================================================

function avgPoints(data: MetricsTimeseries | undefined): number | null {
  if (!data?.points || data.points.length === 0) return null;
  const valid = data.points.filter((p) => p.value !== null && p.value !== undefined);
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, p) => acc + (p.value as number), 0);
  return sum / valid.length;
}
