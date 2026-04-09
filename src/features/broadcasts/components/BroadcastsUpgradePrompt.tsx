import { useNavigate } from 'react-router-dom';
import { Megaphone, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * BroadcastsUpgradePrompt
 *
 * Shown in place of the Broadcasts pages when the user's plan does not
 * include access to broadcasts (Free and Starter tiers). Rendered inline
 * so the user keeps the same URL — no redirect — and sees a clear upgrade
 * path to the Professional plan.
 */
export function BroadcastsUpgradePrompt() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <BaseHeader
        title={t('broadcasts.page_title')}
        subtitle={t('broadcasts.subtitle')}
      />

      <EmptyState
        icon={<Megaphone className="w-12 h-12 text-neutral-400" />}
        title={t('broadcasts.upgrade_title')}
        description={t('broadcasts.upgrade_description')}
        action={
          <button
            onClick={() => navigate('/my-subscription')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {t('broadcasts.upgrade_cta')}
          </button>
        }
      />
    </div>
  );
}

export default BroadcastsUpgradePrompt;
