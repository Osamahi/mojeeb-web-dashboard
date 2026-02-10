/**
 * Main Actions management page
 * Lists all actions for the selected agent with infinite scroll and filtering
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useInfiniteActions, useInfiniteAllActions } from '../hooks/useActions';
import { useDeleteAction } from '../hooks/useMutateAction';
import { ActionsTable } from '../components/ActionsTable';
import { ActionsTableSkeleton } from '../components/ActionsTableSkeleton';
import { ActionsFilterDrawer } from '../components/ActionsFilterDrawer';
import type { Action, ActionFilters } from '../types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CreateActionModal } from '../components/CreateActionModal';
import { EditActionModal } from '../components/EditActionModal';
import { ActionDetailsDrawer } from '../components/ActionDetailsDrawer';
import { ActionExecutionsModal } from '../components/ActionExecutionsModal';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import { agentService } from '@/features/agents/services/agentService';
import { useQuery } from '@tanstack/react-query';

export function ActionsPage() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === Role.SuperAdmin;

  const [filters, setFilters] = useState<ActionFilters>({});
  const [search, setSearch] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showExecutionsModal, setShowExecutionsModal] = useState(false);

  // Combine search with other filters
  const combinedFilters = useMemo(
    () => ({
      ...filters,
      search: search.trim() || undefined,
    }),
    [filters, search]
  );

  // Fetch all agents (for agent name mapping)
  const { data: agentsData } = useQuery({
    queryKey: ['agents', 'all'],
    queryFn: () => agentService.getAgents(),
    enabled: true, // Always fetch for name display in table
  });

  // Create agent name mapping
  const agentNames = useMemo(() => {
    if (!agentsData) return {};
    return agentsData.reduce((acc, agent) => {
      acc[agent.id] = agent.name;
      return acc;
    }, {} as Record<string, string>);
  }, [agentsData]);

  // Data fetching - SuperAdmin sees all actions, others see only their agent's actions
  const agentActionsQuery = useInfiniteActions(combinedFilters);
  const allActionsQuery = useInfiniteAllActions(combinedFilters);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = isSuperAdmin ? allActionsQuery : agentActionsQuery;

  // Mutations
  const deleteMutation = useDeleteAction();

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.actionType) count++;
    if (filters.isActive !== undefined) count++;
    return count;
  }, [filters]);

  // Handlers
  const handleFilterClick = useCallback(() => {
    setIsFilterDrawerOpen(true);
  }, []);

  const handleCreateClick = useCallback(() => {
    setShowCreateModal(true);
  }, []);

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

  const handleViewExecutions = useCallback((action: Action) => {
    setSelectedAction(action);
    setShowExecutionsModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedAction) return;

    await deleteMutation.mutateAsync(selectedAction.id);
    setShowDeleteConfirm(false);
    setSelectedAction(null);
  }, [selectedAction, deleteMutation]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <BaseHeader
        title="Actions"
        subtitle={
          isSuperAdmin
            ? 'Manage all actions across all agents'
            : 'Manage AI agent actions and automations'
        }
        showFilterButton
        activeFilterCount={activeFilterCount}
        onFilterClick={handleFilterClick}
        primaryAction={{
          label: 'Create Action',
          icon: Plus,
          onClick: handleCreateClick,
        }}
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search actions by name, description, or trigger..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <ActionsTableSkeleton />
      ) : (
        <ActionsTable
          actions={data?.actions || []}
          hasMore={hasNextPage || false}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewExecutions={handleViewExecutions}
          agentNames={agentNames}
        />
      )}

      {/* Filter Drawer */}
      <ActionsFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Action"
        message={`Are you sure you want to delete "${selectedAction?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Create Action Modal */}
      <CreateActionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Action Modal */}
      <EditActionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAction(null);
        }}
        action={selectedAction}
      />

      {/* Action Details Drawer */}
      <ActionDetailsDrawer
        isOpen={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedAction(null);
        }}
        action={selectedAction}
      />

      {/* Action Executions Modal */}
      <ActionExecutionsModal
        isOpen={showExecutionsModal}
        onClose={() => {
          setShowExecutionsModal(false);
          setSelectedAction(null);
        }}
        action={selectedAction}
      />
    </div>
  );
}
