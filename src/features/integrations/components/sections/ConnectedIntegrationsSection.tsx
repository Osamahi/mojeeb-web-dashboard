/**
 * Connected Integrations Section
 *
 * Lists the user's active integration connections at the top of the Tools page.
 * Mirrors the visual treatment of `ConnectedPlatformsSection` from /connections
 * so the two surfaces feel like a family.
 *
 * `enabledOpsByConnection` is pre-derived once in the page (from the agent's
 * actions) so each card can show op-chip state without re-querying.
 */

import { useTranslation } from 'react-i18next';
import { Plug } from 'lucide-react';
import { ConnectedIntegrationCard } from '../cards/ConnectedIntegrationCard';
import type { IntegrationConnection } from '../../types';

export interface ConnectedIntegrationsSectionProps {
  connections: IntegrationConnection[];
  /** Map of connectionId → set of enabled op ids. Computed once in the page. */
  enabledOpsByConnection: Map<string, Set<string>>;
  /** Map of connectionId → most-used target tab name (drives the subtitle's "leads tab" segment). */
  mostUsedTabByConnection: Map<string, string>;
  isLoading?: boolean;
  /** Open the edit-actions modal for this connection. */
  onEdit: (connectionId: string) => void;
  onDelete: (connectionId: string) => void;
  deletingId?: string | null;
}

export function ConnectedIntegrationsSection({
  connections,
  enabledOpsByConnection,
  mostUsedTabByConnection,
  isLoading = false,
  onEdit,
  onDelete,
  deletingId,
}: ConnectedIntegrationsSectionProps) {
  const { t } = useTranslation();

  // Defensive: the page already guards on `connections.length > 0`, but if a
  // delete races and leaves us briefly empty, render nothing rather than an
  // empty heading.
  if (!isLoading && connections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t('tools.your_integrations_heading', { count: connections.length })}
        </h2>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {connections.map((connection) => (
            <ConnectedIntegrationCard
              key={connection.id}
              connection={connection}
              enabledOps={enabledOpsByConnection.get(connection.id) ?? new Set()}
              mostUsedTab={mostUsedTabByConnection.get(connection.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingId === connection.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Empty-state companion shown when the user has zero connections. Page chooses
 * whether to render this instead of the active section. Soft placeholder, not a
 * full hero — the catalog below is the real CTA.
 */
export function ConnectedIntegrationsEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-2 border border-neutral-200">
        <Plug className="w-5 h-5 text-neutral-400" />
      </div>
      <p className="text-sm font-medium text-neutral-700 mb-0.5">
        {t('tools.empty_active_title')}
      </p>
      <p className="text-xs text-neutral-500 text-center max-w-sm">
        {t('tools.empty_active_subtitle')}
      </p>
    </div>
  );
}
