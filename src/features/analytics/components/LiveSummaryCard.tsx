import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Users,
  UserPlus,
  Activity,
  Frown,
  Workflow,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import type { LiveSummary } from '../types/analytics.types';

interface LiveSummaryCardProps {
  summary: LiveSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

/**
 * Hero card — today's headline numbers for one agent. Six tiles in a
 * responsive grid. Updates live when useAnalyticsRealtime invalidates the
 * underlying query.
 */
export function LiveSummaryCard({ summary, isLoading, isError, onRetry }: LiveSummaryCardProps) {
  const { t } = useTranslation();

  if (isError) {
    return (
      <ErrorState
        title={t('analytics.error_loading_summary')}
        onRetry={onRetry}
      />
    );
  }

  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const tiles = [
    {
      icon: MessageSquare,
      label: t('analytics.messages_today'),
      value: formatNumber(summary.messagesToday),
    },
    {
      icon: Activity,
      label: t('analytics.conversations_active'),
      value: formatNumber(summary.conversationsActive),
      subtitle: t('analytics.active_5min_window'),
    },
    {
      icon: Users,
      label: t('analytics.unique_customers_today'),
      value: formatNumber(summary.uniqueCustomersToday),
    },
    {
      icon: UserPlus,
      label: t('analytics.actions_executed_today'),
      value: formatNumber(summary.actionsExecutedToday),
    },
    {
      icon: Workflow,
      label: t('analytics.avg_sentiment_today'),
      value: summary.avgSentimentToday !== null
        ? summary.avgSentimentToday.toFixed(1)
        : '—',
      subtitle: t('analytics.sentiment_scale_hint'),
    },
    {
      icon: Frown,
      label: t('analytics.angry_count_today'),
      value: formatNumber(summary.angryCountToday),
      isWarning: summary.angryCountToday > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => (
        <SummaryTile key={tile.label} {...tile} />
      ))}
    </div>
  );
}

interface SummaryTileProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  isWarning?: boolean;
}

function SummaryTile({ icon: Icon, label, value, subtitle, isWarning }: SummaryTileProps) {
  return (
    <div
      className={`bg-white border rounded-xl p-4 ${
        isWarning ? 'border-amber-300 bg-amber-50' : 'border-neutral-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-neutral-500 leading-tight">{label}</p>
        <Icon
          className={`h-4 w-4 flex-shrink-0 ${
            isWarning ? 'text-amber-500' : 'text-neutral-400'
          }`}
        />
      </div>
      <p
        className={`text-2xl font-semibold mt-2 ${
          isWarning ? 'text-amber-700' : 'text-neutral-900'
        }`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] text-neutral-400 mt-1 truncate">{subtitle}</p>
      )}
    </div>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}
