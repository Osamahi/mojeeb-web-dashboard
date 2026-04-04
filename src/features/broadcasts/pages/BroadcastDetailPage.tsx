import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, CheckCircle2, Eye, XCircle, Loader2, RotateCcw,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDateLocale } from '@/lib/dateConfig';
import { useTranslation } from 'react-i18next';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useBroadcastDetail, useBroadcastRecipients, useRetryFailed } from '../hooks/useBroadcasts';
import { useBroadcastDetailRealtime } from '../hooks/useBroadcastRealtime';
import type { RecipientStatus } from '../types/broadcast.types';
import { toast } from 'sonner';

function getErrorMessage(rawError: string | undefined | null, t: (key: string) => string): string {
  if (!rawError) return '—';
  const codeMatch = rawError.match(/^(\d+):/);
  if (codeMatch) {
    const code = codeMatch[1];
    const translated = t(`broadcast_errors.${code}`);
    if (translated !== `broadcast_errors.${code}`) return `${code}: ${translated}`;
  }
  const unknown = t('broadcast_errors.unknown');
  return unknown !== 'broadcast_errors.unknown' ? unknown : rawError;
}

const STATUS_BADGE_STYLES: Record<RecipientStatus | 'pending', string> = {
  pending: 'bg-neutral-100 text-neutral-600',
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  read: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

export function BroadcastDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { agentId } = useAgentContext();
  const { formatSmartTimestamp } = useDateLocale();
  const { t } = useTranslation();
  const [recipientFilter, setRecipientFilter] = useState<string | undefined>(undefined);

  useBroadcastDetailRealtime(campaignId);

  const { data: campaign, isLoading } = useBroadcastDetail(agentId, campaignId);
  const retryMutation = useRetryFailed();

  const {
    data: recipientData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBroadcastRecipients(agentId, campaignId, recipientFilter);

  const recipients = useMemo(
    () => recipientData?.pages.flatMap((page) => page.items) ?? [],
    [recipientData]
  );

  useDocumentTitle(campaign?.campaign_name ?? t('broadcasts.title'));

  const handleRetry = useCallback(() => {
    if (!campaignId || !agentId) return;
    retryMutation.mutate({ agentId, campaignId }, {
      onSuccess: () => toast.success(t('broadcasts.retry_started')),
      onError: () => toast.error(t('broadcasts.retry_error')),
    });
  }, [campaignId, agentId, retryMutation, t]);

  const statusFilters = useMemo(() => [
    { label: t('broadcasts.filter_all'), value: undefined },
    { label: t('broadcasts.filter_sent'), value: 'sent' },
    { label: t('broadcasts.filter_delivered'), value: 'delivered' },
    { label: t('broadcasts.filter_read'), value: 'read' },
    { label: t('broadcasts.filter_failed'), value: 'failed' },
  ], [t]);

  if (isLoading || !campaign) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const pct = (count: number, total: number) =>
    total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/broadcasts')}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('broadcasts.back_to_broadcasts')}
        </button>
        <h1 className="text-2xl font-semibold text-neutral-900">{campaign.campaign_name}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {t('broadcasts.template_label')} {campaign.template_name} &middot; {t('broadcasts.language_label')} {campaign.language_code} &middot; {t('broadcasts.created_label')} {formatSmartTimestamp(campaign.created_at)}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Send className="w-5 h-5 text-blue-500" />}
          label={t('broadcasts.metric_sent')}
          count={campaign.sent_count}
          total={campaign.recipient_count}
          pct={pct(campaign.sent_count, campaign.recipient_count)}
        />
        <MetricCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label={t('broadcasts.metric_delivered')}
          count={campaign.delivered_count}
          total={campaign.sent_count}
          pct={pct(campaign.delivered_count, campaign.sent_count)}
        />
        <MetricCard
          icon={<Eye className="w-5 h-5 text-emerald-500" />}
          label={t('broadcasts.metric_read')}
          count={campaign.read_count}
          total={campaign.delivered_count}
          pct={pct(campaign.read_count, campaign.delivered_count)}
        />
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-neutral-500">{t('broadcasts.metric_failed')}</span>
            </div>
            {campaign.failed_count > 0 && (
              <button
                onClick={handleRetry}
                disabled={retryMutation.isPending || campaign.status === 'sending'}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                {t('broadcasts.retry')}
              </button>
            )}
          </div>
          <div className="mt-2">
            <span className="text-2xl font-semibold text-neutral-900">{campaign.failed_count}</span>
            <span className="text-sm text-neutral-400 ms-1">
              / {campaign.recipient_count} ({pct(campaign.failed_count, campaign.recipient_count)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Recipients Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => setRecipientFilter(f.value)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                recipientFilter === f.value
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-start px-4 py-2 text-xs font-medium text-neutral-500 uppercase">{t('broadcasts.col_phone')}</th>
              <th className="text-start px-4 py-2 text-xs font-medium text-neutral-500 uppercase">{t('broadcasts.col_name')}</th>
              <th className="text-start px-4 py-2 text-xs font-medium text-neutral-500 uppercase">{t('broadcasts.col_status')}</th>
              <th className="text-start px-4 py-2 text-xs font-medium text-neutral-500 uppercase">{t('broadcasts.col_sent_at')}</th>
              <th className="text-start px-4 py-2 text-xs font-medium text-neutral-500 uppercase">{t('broadcasts.col_delivered_at')}</th>
              <th className="text-start px-4 py-2 text-xs font-medium text-neutral-500 uppercase hidden md:table-cell">{t('broadcasts.col_error')}</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => {
              const badgeStyle = STATUS_BADGE_STYLES[r.status] ?? STATUS_BADGE_STYLES.pending;
              return (
                <tr key={r.id} className="border-b border-neutral-50">
                  <td className="px-4 py-2 text-sm font-mono text-neutral-700">{r.phone}</td>
                  <td className="px-4 py-2 text-sm text-neutral-600">{r.name || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyle}`}>
                      {t(`broadcasts.status_${r.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-neutral-500">
                    {r.sent_at ? formatSmartTimestamp(r.sent_at) : '—'}
                  </td>
                  <td className="px-4 py-2 text-sm text-neutral-500">
                    {r.delivered_at ? formatSmartTimestamp(r.delivered_at) : '—'}
                  </td>
                  <td className="px-4 py-2 text-sm text-red-500 hidden md:table-cell max-w-xs truncate">
                    {r.error_message ? getErrorMessage(r.error_message, t) : '—'}
                  </td>
                </tr>
              );
            })}
            {recipients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">
                  {t('broadcasts.no_recipients')}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {hasNextPage && (
          <div className="px-4 py-3 border-t border-neutral-100">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              {isFetchingNextPage ? t('broadcasts.loading') : t('broadcasts.load_more')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon, label, count, total, pct,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  pct: number;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-neutral-500">{label}</span>
      </div>
      <div className="mt-2">
        <span className="text-2xl font-semibold text-neutral-900">{count}</span>
        <span className="text-sm text-neutral-400 ms-1">/ {total} ({pct}%)</span>
      </div>
    </div>
  );
}

export default BroadcastDetailPage;
