/**
 * Customer-facing Tools page — agent-scoped CRUD over the same `actions` resource that powers
 * the SuperAdmin /actions page. Same hooks, same modals, same table component. Differences:
 *   - Always agent-scoped (no /actions/all branch).
 *   - No filter drawer (search-only, per product decision).
 *   - No execution history (the table hides "View Executions" when onViewExecutions is omitted).
 *   - Empty state when no agent is selected (mirrors LeadsPage's UX).
 *
 * Backend authorization: list/get use [OrgPermission("read")]; create/edit/delete use ("write").
 * Both check agent ownership for the user's org. Cross-tenant attempts surface as 404 in the
 * controller's error mapper.
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Sparkles } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useInfiniteActions } from '../hooks/useActions';
import { useDeleteAction } from '../hooks/useMutateAction';
import { ActionsTable } from '../components/ActionsTable';
import { ActionsTableSkeleton } from '../components/ActionsTableSkeleton';
import type { Action } from '../types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CreateActionModal } from '../components/CreateActionModal';
import { EditActionModal } from '../components/EditActionModal';
import { ActionDetailsDrawer } from '../components/ActionDetailsDrawer';

export function ToolsPage() {
  const { t } = useTranslation();
  useDocumentTitle('tools.title');
  const { isAgentSelected } = useAgentContext();

  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);

  // Search is the only filter on /tools (filters drawer was scoped out per product decision).
  const filters = useMemo(
    () => ({ search: search.trim() || undefined }),
    [search]
  );

  // useInfiniteActions reads the current agentId from useAgentContext internally and is gated
  // on agent presence — when no agent is selected the query stays disabled.
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteActions(filters);

  const deleteMutation = useDeleteAction();

  const handleCreateClick = useCallback(() => setShowCreateModal(true), []);
  const handleView = useCallback((action: Action) => {
    setSelectedAction(action);
    setShowDetailsDrawer(true);
  }, []);
  const handleEdit = useCallback((action: Action) => {
    setSelectedAction(action);
    setShowEditModal(true);
  }, []);
  const handleDelete = useCallback((action: Action) => {
    setSelectedAction(action);
    setShowDeleteConfirm(true);
  }, []);
  const confirmDelete = useCallback(async () => {
    if (!selectedAction) return;
    await deleteMutation.mutateAsync(selectedAction.id);
    setShowDeleteConfirm(false);
    setSelectedAction(null);
  }, [selectedAction, deleteMutation]);

  // No agent selected → nudge them to pick one. Mirrors LeadsPage / Setup empty state.
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

  const actions = data?.actions ?? [];

  return (
    <div className="p-6 space-y-6">
      <BaseHeader
        title={t('tools.title')}
        subtitle={t('tools.subtitle')}
        primaryAction={{
          label: t('tools.create_button'),
          icon: Plus,
          onClick: handleCreateClick,
        }}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder={t('tools.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <ActionsTableSkeleton />
      ) : actions.length === 0 && !search ? (
        <EmptyState
          icon={<Sparkles className="w-12 h-12 text-neutral-400" />}
          title={t('tools.empty_title')}
          description={t('tools.empty_description')}
          action={
            <button
              type="button"
              onClick={handleCreateClick}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('tools.create_button')}
            </button>
          }
        />
      ) : (
        <ActionsTable
          actions={actions}
          hasMore={hasNextPage || false}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          // onViewExecutions intentionally omitted — /tools is for managing tools, not auditing runs.
          agentNames={{}}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title={t('tools.delete_title')}
        message={t('tools.delete_message', { name: selectedAction?.name ?? '' })}
        confirmText={t('common.delete')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <CreateActionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <EditActionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAction(null);
        }}
        action={selectedAction}
      />

      <ActionDetailsDrawer
        isOpen={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedAction(null);
        }}
        action={selectedAction}
      />
    </div>
  );
}
