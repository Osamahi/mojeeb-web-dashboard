import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { LiveSummaryCard } from '../components/LiveSummaryCard';
import { MetricsTimeseriesChart } from '../components/MetricsTimeseriesChart';
import { AngryConversationsList } from '../components/AngryConversationsList';
import { useLiveSummary } from '../hooks/useLiveSummary';
import { useMetricsTimeseries } from '../hooks/useMetricsTimeseries';
import { useAngryConversations } from '../hooks/useAngryConversations';
import { useAnalyticsRealtime } from '../hooks/useAnalyticsRealtime';
import type {
  AnalyticsMetric,
  TimeseriesWindow,
} from '../types/analytics.types';

/**
 * Live per-agent analytics dashboard.
 *
 * Layout:
 *   - Hero card: today's headline numbers (6 tiles)
 *   - Time-series chart: switchable metric × switchable window
 *   - Angry conversations list: drilldown to chat detail
 *
 * Live updates: useAnalyticsRealtime subscribes to the underlying counter
 * tables and angry-conversations dedupe set, debounced-invalidates the
 * three queries on any change. The dashboard ticks without polling.
 */
export default function AgentAnalyticsPage() {
  const { t } = useTranslation();
  const { agentId, isAgentSelected } = useAgentContext();
  useDocumentTitle(t('analytics.page_title'));

  // Wire up Realtime — fires queryClient.invalidateQueries on counter changes.
  useAnalyticsRealtime(agentId);

  // Chart toggle state — local to the page.
  const [metric, setMetric] = useState<AnalyticsMetric>('messages');
  const [window, setWindow] = useState<TimeseriesWindow>('24h');

  const summary = useLiveSummary(agentId);
  const timeseries = useMetricsTimeseries(agentId, metric, window);
  const angry = useAngryConversations(agentId, 24);

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
      <BaseHeader
        title={t('analytics.page_title')}
        subtitle={t('analytics.page_subtitle')}
      />

      <LiveSummaryCard
        summary={summary.data}
        isLoading={summary.isLoading}
        isError={summary.isError}
        onRetry={() => summary.refetch()}
      />

      <MetricsTimeseriesChart
        data={timeseries.data}
        metric={metric}
        window={window}
        isLoading={timeseries.isLoading}
        isError={timeseries.isError}
        onMetricChange={setMetric}
        onWindowChange={setWindow}
        onRetry={() => timeseries.refetch()}
      />

      <AngryConversationsList
        conversations={angry.data}
        isLoading={angry.isLoading}
        isError={angry.isError}
        onRetry={() => angry.refetch()}
      />
    </div>
  );
}
