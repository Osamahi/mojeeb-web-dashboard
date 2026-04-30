import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ExternalLink, KeyRound, Plus, Trash2 } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDateLocale } from '@/lib/dateConfig';
import { useApiKeys } from '../hooks/useApiKeys';
import { useHasApiAccess } from '../hooks/useHasApiAccess';
import { formatApiKeyDisplay, type ApiKey } from '../types/apiKey.types';
import { AgentIdsSection } from '../components/AgentIdsSection';
import { ApiKeysUpgradePrompt } from '../components/ApiKeysUpgradePrompt';
import { CreateApiKeyModal } from '../components/CreateApiKeyModal';
import { RevokeApiKeyDialog } from '../components/RevokeApiKeyDialog';

const DOCS_URL = 'https://docs.mojeeb.app/docs/developers/overview';
const QUICKSTART_URL = 'https://docs.mojeeb.app/docs/developers/quickstart';

/**
 * ApiKeysPage
 *
 * Lists the org's API keys with create / revoke actions. Plan-gated via
 * useHasApiAccess — non-Professional plans see ApiKeysUpgradePrompt instead.
 *
 * Design: simple table layout. Edit (rename / change scopes) deferred to a
 * later iteration — create + revoke covers the v1 lifecycle (rotate = create
 * new + revoke old).
 */
export function ApiKeysPage() {
  const { t } = useTranslation();
  const hasAccess = useHasApiAccess();
  // Don't fire the GET until we know the org has access — otherwise the
  // backend 403s and the centralized interceptor flashes a toast under
  // the upgrade prompt.
  const { data: keys = [], isLoading, isError } = useApiKeys(hasAccess);
  const { formatSmartTimestamp } = useDateLocale();

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  if (!hasAccess) {
    return <ApiKeysUpgradePrompt />;
  }

  const activeKeys = keys.filter((k) => !k.revoked_at);
  const revokedKeys = keys.filter((k) => k.revoked_at);

  return (
    <div className="p-6 space-y-6" data-testid="api-keys-page">
      <BaseHeader
        title={t('api_keys.page_title', 'API Keys')}
        subtitle={t('api_keys.subtitle', 'Manage credentials for the Mojeeb public API')}
        additionalActions={
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            {t('api_keys.docs_link', 'Developer docs')}
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </a>
        }
        primaryAction={{
          label: t('api_keys.create_cta', 'Create key'),
          icon: Plus,
          onClick: () => setCreateOpen(true),
        }}
      />

      {isLoading && (
        <div className="text-center text-sm text-neutral-500 py-12">
          {t('common.loading', 'Loading…')}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {t('api_keys.load_error', 'Could not load API keys.')}
        </div>
      )}

      {!isLoading && !isError && keys.length === 0 && (
        <EmptyState
          icon={<KeyRound className="w-12 h-12 text-neutral-400" />}
          title={t('api_keys.empty_title', 'No API keys yet')}
          description={t(
            'api_keys.empty_description',
            "Create your first key to start integrating with Mojeeb's public API."
          )}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('api_keys.create_cta', 'Create key')}
              </button>
              <a
                href={QUICKSTART_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                {t('api_keys.read_quickstart', 'Read the quickstart')}
              </a>
            </div>
          }
        />
      )}

      {activeKeys.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-700">
            {t('api_keys.active_section', 'Active')} ({activeKeys.length})
          </h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{t('api_keys.col_name', 'Name')}</th>
                  <th className="px-4 py-2 font-medium">{t('api_keys.col_key', 'Key')}</th>
                  <th className="px-4 py-2 font-medium">{t('api_keys.col_scopes', 'Scopes')}</th>
                  <th className="px-4 py-2 font-medium">{t('api_keys.col_agents', 'Agents')}</th>
                  <th className="px-4 py-2 font-medium">{t('api_keys.col_last_used', 'Last used')}</th>
                  <th className="px-4 py-2 font-medium">{t('api_keys.col_created', 'Created')}</th>
                  <th className="px-4 py-2 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {activeKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{key.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                      {formatApiKeyDisplay(key)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((s) => (
                          <span
                            key={s}
                            className="inline-flex rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono text-neutral-700"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {key.agent_ids === null || key.agent_ids.length === 0 ? (
                        <span className="inline-flex rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 border border-emerald-200">
                          {t('api_keys.agents_all', 'All agents')}
                        </span>
                      ) : (
                        <span
                          className="inline-flex rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-800 border border-amber-200"
                          title={key.agent_ids.join('\n')}
                        >
                          {key.agent_ids.length === 1
                            ? t('api_keys.agents_restricted_one', '1 agent')
                            : `${key.agent_ids.length} ${t('api_keys.agents_word', 'agents')}`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {key.last_used_at
                        ? formatSmartTimestamp(key.last_used_at)
                        : t('api_keys.never_used', 'Never')}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatSmartTimestamp(key.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setRevokeTarget(key)}
                        className="text-rose-600 hover:text-rose-700"
                        title={t('api_keys.revoke_cta', 'Revoke') ?? ''}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {revokedKeys.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">
            {t('api_keys.revoked_section', 'Revoked')} ({revokedKeys.length})
          </h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200 opacity-70">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-neutral-200">
                {revokedKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-4 py-3 font-medium text-neutral-700">{key.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                      {formatApiKeyDisplay(key)}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {t('api_keys.revoked_at', 'Revoked')}{' '}
                      {key.revoked_at && formatSmartTimestamp(key.revoked_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AgentIdsSection />

      <CreateApiKeyModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <RevokeApiKeyDialog
        apiKey={revokeTarget}
        isOpen={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
      />
    </div>
  );
}

export default ApiKeysPage;
