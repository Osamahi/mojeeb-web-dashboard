import { useNavigate } from 'react-router-dom';
import { KeyRound, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * ApiKeysUpgradePrompt
 *
 * Shown when the user's plan does not include the `api_access` feature.
 * Rendered inline so the URL doesn't change — clear upgrade path.
 */
export function ApiKeysUpgradePrompt() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <BaseHeader
        title={t('api_keys.page_title', 'API Keys')}
        subtitle={t('api_keys.subtitle', 'Manage credentials for the Mojeeb public API')}
      />

      <EmptyState
        icon={<KeyRound className="w-12 h-12 text-neutral-400" />}
        title={t('api_keys.upgrade_title', 'API access is a Professional feature')}
        description={t(
          'api_keys.upgrade_description',
          'Upgrade your plan to manage API keys and integrate Mojeeb with your own systems.'
        )}
        action={
          <button
            onClick={() => navigate('/my-subscription')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {t('api_keys.upgrade_cta', 'Upgrade plan')}
          </button>
        }
      />
    </div>
  );
}

export default ApiKeysUpgradePrompt;
