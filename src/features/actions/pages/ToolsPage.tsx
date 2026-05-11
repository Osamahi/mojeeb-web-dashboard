/**
 * Tools page — integration catalog view.
 *
 * Reframed (May 2026) from a flat actions table to the integration-centric view.
 * What customers see:
 *   1. Their active integration connections at top, each showing per-operation
 *      chips (Add row / Update row / Read row, etc.) indicating which ops are
 *      wired up via at least one action on the current agent.
 *   2. The full integration catalog below — available integrations first with
 *      Connect CTA, coming-soon below with grayscale icons + Notify-me CTA.
 *
 * The per-action technical CRUD (create / edit / delete individual actions,
 * inspect trigger prompts, manage column mappings) moved to `/actions` — the
 * SuperAdmin-style page that already exists. Linked from each connected card's
 * dropdown so power users can still reach it.
 *
 * Backend authorization: list/get use [OrgPermission("read")]; delete uses
 * ("write"). Cross-tenant attempts surface as 404 in the controller's error mapper.
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link2, RefreshCw, Sparkles } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useInfiniteActions } from '../hooks/useActions';
import {
  useIntegrationConnections,
  useDeleteConnection,
} from '@/features/integrations/hooks/useIntegrations';
import {
  ConnectedIntegrationsSection,
  ConnectedIntegrationsEmptyState,
} from '@/features/integrations/components/sections/ConnectedIntegrationsSection';
import { AvailableIntegrationsSection } from '@/features/integrations/components/sections/AvailableIntegrationsSection';
import CreateConnectionModal from '@/features/integrations/components/CreateConnectionModal';
import { EditConnectionActionsModal } from '@/features/integrations/components/EditConnectionActionsModal';
import type { Action } from '../types';

export function ToolsPage() {
  const { t } = useTranslation();
  useDocumentTitle('tools.title');
  const { isAgentSelected } = useAgentContext();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Edit-actions modal — host state at page level so a single modal serves
  // every connection card. Holds the targeted connection id; modal closes by
  // clearing it. This matches the pattern used by /connections's edit drawer.
  const [editTargetConnectionId, setEditTargetConnectionId] = useState<string | null>(null);

  // Org-scoped integration connections (not agent-scoped — same connection can
  // be shared across agents in the same org via FK on actions.integration_connection_id).
  const {
    data: connections,
    isLoading: isLoadingConnections,
    error: connectionsError,
    refetch,
    isFetching,
  } = useIntegrationConnections();
  const deleteMutation = useDeleteConnection();

  // Agent-scoped actions — feeds the "which ops are enabled per connection" derivation.
  // We use the cursor-paginated infinite hook but only consume the first page (50 actions)
  // for the chip computation — typical agents have far fewer integration actions; missing
  // chips for power-users with >50 actions degrades gracefully (chip just shows outlined).
  const { data: actionsData } = useInfiniteActions();

  // Three derivations from the same actions list:
  //   1. Which operations are wired up per connection (drives the op chips)
  //   2. Which tab each connection is most commonly targeted at (drives the
  //      "leads tab" segment in the subtitle).
  //   3. The full action list per connection (drives the Edit modal, where
  //      we need each existing action to diff against the user's form state).
  const {
    enabledOpsByConnection,
    mostUsedTabByConnection,
    actionsByConnection,
  } = useMemo(() => {
    const opsMap = new Map<string, Set<string>>();
    const tabCounts = new Map<string, Map<string, number>>();
    const actionsMap = new Map<string, Action[]>();
    const actions = actionsData?.actions ?? [];

    for (const action of actions) {
      if (action.actionType !== 'integration') continue;
      if (!action.integrationConnectionId) continue;

      const operationId = action.actionConfig?.operation as string | undefined;
      const targetTab = action.actionConfig?.target_tab as string | undefined;
      const connId = action.integrationConnectionId;

      if (operationId) {
        const existing = opsMap.get(connId);
        if (existing) existing.add(operationId);
        else opsMap.set(connId, new Set([operationId]));
      }

      if (targetTab) {
        const tabs = tabCounts.get(connId) ?? new Map<string, number>();
        tabs.set(targetTab, (tabs.get(targetTab) ?? 0) + 1);
        tabCounts.set(connId, tabs);
      }

      const bucket = actionsMap.get(connId) ?? [];
      bucket.push(action);
      actionsMap.set(connId, bucket);
    }

    // Reduce each connection's tab-count map to its single most-used tab.
    const tabMap = new Map<string, string>();
    for (const [connId, counts] of tabCounts) {
      let bestTab = '';
      let bestCount = 0;
      for (const [tab, count] of counts) {
        if (count > bestCount) {
          bestCount = count;
          bestTab = tab;
        }
      }
      if (bestTab) tabMap.set(connId, bestTab);
    }

    return {
      enabledOpsByConnection: opsMap,
      mostUsedTabByConnection: tabMap,
      actionsByConnection: actionsMap,
    };
  }, [actionsData]);

  // Connect-row CTA — currently always opens CreateConnectionModal (which today
  // hard-codes google_sheets as the only connectable type). When more connectors
  // ship, the modal will accept a `preselectedConnectorType` argument; until then
  // the catalog row's "Connect" CTA is the only entry point so context is implicit.
  const handleConnect = useCallback((_connectorType: string) => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleEdit = useCallback((connectionId: string) => {
    setEditTargetConnectionId(connectionId);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditTargetConnectionId(null);
  }, []);

  const handleDelete = useCallback((connectionId: string) => {
    setDeleteCandidateId(connectionId);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteCandidateId) return;
    await deleteMutation.mutateAsync(deleteCandidateId);
    setDeleteCandidateId(null);
  }, [deleteCandidateId, deleteMutation]);

  // No agent selected → nudge them to pick one. Mirrors LeadsPage / Setup empty
  // state. Connections are org-scoped but chip-state needs the agent, so we keep
  // the gate for now to avoid showing every connection with all-outlined chips
  // (which would be misleading).
  if (!isAgentSelected) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <EmptyState
          icon={<Sparkles className="w-12 h-12 text-neutral-400" />}
          title={t('tools.no_agent_title')}
          description={t('tools.no_agent_description')}
        />
      </div>
    );
  }

  const hasConnections = !!connections && connections.length > 0;

  return (
    <div className="p-6 space-y-8">
      <BaseHeader
        title={t('tools.title')}
        subtitle={t('tools.subtitle')}
      />

      {/* Error state — full-page card so the user can't miss it. */}
      {connectionsError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <EmptyState
              icon={<Link2 className="w-12 h-12 text-neutral-400" />}
              title={t('tools.load_error_title')}
              description={
                connectionsError instanceof Error
                  ? connectionsError.message
                  : t('tools.load_error_title')
              }
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="mt-4"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  {isFetching ? t('common.retrying') : t('common.retry')}
                </Button>
              }
            />
          </Card>
        </motion.div>
      )}

      {/* Connected section — only renders when there are connections. The empty
          case below (no connections) gets a soft placeholder instead, so the
          catalog itself doesn't have to do double-duty as both directory + CTA. */}
      {!connectionsError && hasConnections && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ConnectedIntegrationsSection
              connections={connections}
              enabledOpsByConnection={enabledOpsByConnection}
              mostUsedTabByConnection={mostUsedTabByConnection}
              isLoading={isLoadingConnections}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deletingId={
                deleteMutation.isPending ? deleteMutation.variables ?? null : null
              }
            />
          </motion.div>

          <div className="border-t border-neutral-200" />
        </>
      )}

      {/* Soft empty placeholder when the user has zero connections. Don't render
          this AND the active section — exactly one of the two is shown. */}
      {!connectionsError && !isLoadingConnections && !hasConnections && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ConnectedIntegrationsEmptyState />
        </motion.div>
      )}

      {/* Available + Coming Soon — always renders (catalog is static metadata,
          not a network response). Coming-soon items show grayscale icons and
          Notify-me CTAs instead of Connect. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AvailableIntegrationsSection
          onConnect={handleConnect}
          isLoading={false}
        />
      </motion.div>

      <CreateConnectionModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />

      <EditConnectionActionsModal
        isOpen={!!editTargetConnectionId}
        onClose={handleCloseEditModal}
        connection={
          editTargetConnectionId
            ? connections?.find((c) => c.id === editTargetConnectionId) ?? null
            : null
        }
        connectionActions={
          editTargetConnectionId ? actionsByConnection.get(editTargetConnectionId) ?? [] : []
        }
        mostUsedTab={
          editTargetConnectionId ? mostUsedTabByConnection.get(editTargetConnectionId) : undefined
        }
      />

      <ConfirmDialog
        isOpen={!!deleteCandidateId}
        onClose={() => setDeleteCandidateId(null)}
        onConfirm={confirmDelete}
        title={t('tools.delete_connection_title')}
        message={t('tools.delete_connection_message')}
        confirmText={t('common.delete')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
