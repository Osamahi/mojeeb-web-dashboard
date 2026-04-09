import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDateLocale } from '@/lib/dateConfig';
import { useTranslation } from 'react-i18next';
import { useBroadcastCampaigns } from '../hooks/useBroadcasts';
import { useBroadcastListRealtime } from '../hooks/useBroadcastRealtime';
import { useHasBroadcastsAccess } from '../hooks/useHasBroadcastsAccess';
import { CreateBroadcastWizard } from '../components/CreateBroadcastWizard';
import { BroadcastsUpgradePrompt } from '../components/BroadcastsUpgradePrompt';
import type { BroadcastCampaign, BroadcastStatus } from '../types/broadcast.types';

const STATUS_STYLES: Record<BroadcastStatus, { className: string; icon: React.ReactNode }> = {
  draft: { className: 'bg-neutral-100 text-neutral-600', icon: <Clock className="w-3 h-3" /> },
  sending: { className: 'bg-blue-100 text-blue-700 animate-pulse', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  paused: { className: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
  completed: { className: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { className: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
};

export function BroadcastsPage() {
  // Plan gate: Free/Starter users see the upgrade prompt instead of the
  // real page. SuperAdmin and Professional users fall through to the
  // full page. We guard at the top so no data fetching or realtime
  // subscriptions happen for ineligible users.
  const hasAccess = useHasBroadcastsAccess();
  if (!hasAccess) {
    return <BroadcastsUpgradePrompt />;
  }
  return <BroadcastsPageContent />;
}

function BroadcastsPageContent() {
  const { t } = useTranslation();
  useDocumentTitle(t('broadcasts.title'));
  const { agentId } = useAgentContext();
  const navigate = useNavigate();
  const { formatSmartTimestamp } = useDateLocale();
  const [showWizard, setShowWizard] = useState(false);

  useBroadcastListRealtime(agentId);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBroadcastCampaigns(agentId);

  const campaigns = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const handleCreateClick = useCallback(() => setShowWizard(true), []);
  const handleCloseWizard = useCallback(() => setShowWizard(false), []);
  const handleRowClick = useCallback(
    (campaign: BroadcastCampaign) => navigate(`/broadcasts/${campaign.id}`),
    [navigate]
  );

  if (!agentId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Megaphone className="w-12 h-12 text-neutral-400" />}
          title={t('broadcasts.select_agent')}
          description={t('broadcasts.select_agent_desc')}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <BaseHeader
        title={t('broadcasts.page_title')}
        subtitle={t('broadcasts.subtitle')}
        primaryAction={{
          label: t('broadcasts.new_broadcast'),
          icon: Megaphone,
          onClick: handleCreateClick,
        }}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-12 h-12 text-neutral-400" />}
          title={t('broadcasts.no_broadcasts_title')}
          description={t('broadcasts.no_broadcasts_desc')}
          action={
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              {t('broadcasts.create_broadcast')}
            </button>
          }
        />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-start px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('broadcasts.col_campaign')}</th>
                <th className="text-start px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('broadcasts.col_template')}</th>
                <th className="text-start px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('broadcasts.col_recipients')}</th>
                <th className="text-start px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('broadcasts.col_status')}</th>
                <th className="text-start px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('broadcasts.col_delivery')}</th>
                <th className="text-start px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('broadcasts.col_created')}</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const style = STATUS_STYLES[campaign.status];
                const deliveredPct = campaign.recipient_count > 0
                  ? Math.round((campaign.delivered_count / campaign.recipient_count) * 100)
                  : 0;

                return (
                  <tr
                    key={campaign.id}
                    onClick={() => handleRowClick(campaign)}
                    className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-neutral-900">{campaign.campaign_name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{campaign.template_name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{campaign.recipient_count}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.className}`}>
                        {style.icon}
                        {t(`broadcasts.status_${campaign.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {campaign.status === 'draft' ? '—' : (
                        <span>{t('broadcasts.delivery_text', { sent: campaign.sent_count, total: campaign.recipient_count, pct: deliveredPct })}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500">
                      {formatSmartTimestamp(campaign.created_at)}
                    </td>
                  </tr>
                );
              })}
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
      )}

      <CreateBroadcastWizard
        isOpen={showWizard}
        onClose={handleCloseWizard}
      />
    </div>
  );
}

export default BroadcastsPage;
