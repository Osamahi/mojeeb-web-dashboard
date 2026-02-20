/**
 * LeadsPage Component - Refactored for Performance
 * Architecture: Isolated components prevent unnecessary re-renders
 * - BaseHeader: Static, never re-renders
 * - LeadsFiltersToolbar: Only re-renders when filter state changes
 * - LeadsTableView: Only re-renders when data changes
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useInfiniteLeads } from '../hooks/useLeads';
import { useLeadsSubscription } from '../hooks/useLeadsSubscription';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserPlus, Download, MoreVertical, Columns3, Bot, ListChecks } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LeadsFilterDrawer } from '../components/LeadsFilterDrawer';
import { LeadsTableView } from '../components/LeadsTableView';
import AddLeadModal from '../components/AddLeadModal';
import LeadDetailsDrawer from '../components/LeadDetailsDrawer';
import { LeadNotesModal } from '../components/LeadNotesModal';
import { AddSummaryModal } from '../components/AddSummaryModal';
import { LeadSettingsModal } from '../components/LeadSettingsModal';
import { CustomFieldSchemaModal } from '../components/CustomFieldSchemaModal';
import { StatusEditorModal } from '../components/StatusEditorModal';
import ConversationViewDrawer from '@/features/conversations/components/ConversationViewDrawer';
import { ExportLeadsModal, ExportProgressModal } from '@/features/exports/components';
import { useDeleteLead } from '../hooks/useLeads';
import type { Lead, LeadFilters } from '../types';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function LeadsPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_leads');
  const { isAgentSelected, agentId } = useAgentContext();
  const deleteMutation = useDeleteLead();

  // Modal/Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [openInEditMode, setOpenInEditMode] = useState(false);
  const [notesLead, setNotesLead] = useState<{ id: string; name: string; agentId: string } | null>(null);
  const [summaryLead, setSummaryLead] = useState<{ id: string; name: string; summary: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCustomFieldSchemaModalOpen, setIsCustomFieldSchemaModalOpen] = useState(false);
  const [isStatusEditorOpen, setIsStatusEditorOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    status: 'all',
    dateFrom: undefined,
    dateTo: undefined,
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Fetch data with filters (server-side pagination + filtering)
  const {
    data,
    isLoading,
    error,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteLeads(filters);

  const leads = data?.leads;
  const hasMore = data?.hasMore ?? false;

  // Subscribe to real-time updates
  useLeadsSubscription();

  // ========================================
  // Memoized Callbacks (prevent child re-renders)
  // ========================================

  const handleAddLeadClick = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleFilterDrawerToggle = useCallback(() => {
    setIsFilterDrawerOpen(prev => !prev);
  }, []);

  const handleFilterDrawerClose = useCallback(() => {
    setIsFilterDrawerOpen(false);
  }, []);

  const handleApplyFilters = useCallback((newFilters: LeadFilters) => {
    setFilters(newFilters);
    setIsFilterDrawerOpen(false);
  }, []);

  // Calculate active filter count
  const activeFilterCount = [
    filters.search && 'search',
    filters.status !== 'all' && 'status',
    (filters.dateFrom || filters.dateTo) && 'date',
  ].filter(Boolean).length;

  const handleRowClick = useCallback((lead: Lead) => {
    setOpenInEditMode(false);
    setSelectedLeadId(lead.id);
  }, []);

  const handleEditClick = useCallback((leadId: string) => {
    setOpenInEditMode(true);
    setSelectedLeadId(leadId);
  }, []);

  const handleDeleteClick = useCallback((leadId: string) => {
    setLeadToDelete(leadId);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!leadToDelete) return;
    deleteMutation.mutate(leadToDelete, {
      onSuccess: () => {
        setLeadToDelete(null);
      },
    });
  }, [leadToDelete, deleteMutation]);

  const handleViewConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleAddNoteClick = useCallback((leadId: string, name: string, agentId: string) => {
    setNotesLead({ id: leadId, name, agentId });
  }, []);

  const handleAddSummaryClick = useCallback((leadId: string, name: string, summary: string) => {
    setSummaryLead({ id: leadId, name, summary });
  }, []);

  const handleEditStatusClick = useCallback(() => {
    setIsStatusEditorOpen(true);
  }, []);

  const handleAddColumnClick = useCallback(() => {
    setIsCustomFieldSchemaModalOpen(true);
  }, []);

  const handleExportClick = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const handleExportCreated = useCallback((jobId: string) => {
    setExportJobId(jobId);
  }, []);

  const handleCloseExportProgress = useCallback(() => {
    setExportJobId(null);
  }, []);

  // Memoize more menu button to prevent BaseHeader re-renders
  const moreMenuButton = useMemo(() => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button
          className="w-10 h-10 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors flex items-center justify-center"
          title={t('leads.more')}
        >
          <MoreVertical className="w-5 h-5 text-neutral-700" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleExportClick}>
          <Download className="w-4 h-4 ltr:mr-2 rtl:ml-2 text-neutral-700" />
          <span>{t('leads.extract')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddLeadClick}>
          <UserPlus className="w-4 h-4 ltr:mr-2 rtl:ml-2 text-neutral-700" />
          <span>{t('leads.add_lead')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddColumnClick}>
          <Columns3 className="w-4 h-4 ltr:mr-2 rtl:ml-2 text-neutral-700" />
          <span>{t('leads.edit_columns')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEditStatusClick}>
          <ListChecks className="w-4 h-4 ltr:mr-2 rtl:ml-2 text-neutral-700" />
          <span>{t('leads.edit_statuses')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsSettingsModalOpen(true)}>
          <Bot className="w-4 h-4 ltr:mr-2 rtl:ml-2 text-neutral-700" />
          <span>{t('leads.ai_instructions')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ), [handleExportClick, handleAddLeadClick, t]);

  // ========================================
  // Render Logic
  // ========================================

  // No agent selected
  if (!isAgentSelected) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <EmptyState
          icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
          title={t('leads.no_agent_title')}
          description={t('leads.no_agent_description')}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Static Header with Filter Button - never re-renders */}
      <BaseHeader
        title={t('leads.title')}
        subtitle={t('leads.subtitle')}
        showFilterButton
        activeFilterCount={activeFilterCount}
        onFilterClick={handleFilterDrawerToggle}
        additionalActions={moreMenuButton}
      />

      {/* Filter Drawer - slides in from right */}
      <LeadsFilterDrawer
        isOpen={isFilterDrawerOpen}
        filters={filters}
        onClose={handleFilterDrawerClose}
        onApplyFilters={handleApplyFilters}
      />

      {/* Table View - only re-renders when data changes */}
      <LeadsTableView
        leads={leads}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        filters={filters}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onViewConversation={handleViewConversation}
        onAddLeadClick={handleAddLeadClick}
        onAddNoteClick={handleAddNoteClick}
        onAddSummaryClick={handleAddSummaryClick}
        fetchNextPage={fetchNextPage}
        hasMore={hasMore}
        isFetchingNextPage={isFetchingNextPage}
        onEditStatusClick={handleEditStatusClick}
        onAddColumnClick={handleAddColumnClick}
      />

      {/* Modals & Drawers */}
      <AddLeadModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {selectedLeadId && (
        <LeadDetailsDrawer
          leadId={selectedLeadId}
          onClose={() => {
            setSelectedLeadId(null);
            setOpenInEditMode(false);
          }}
          initialEditMode={openInEditMode}
        />
      )}

      <ConversationViewDrawer
        conversationId={selectedConversationId}
        isOpen={!!selectedConversationId}
        onClose={() => setSelectedConversationId(null)}
      />

      {notesLead && (
        <LeadNotesModal
          isOpen={true}
          onClose={() => setNotesLead(null)}
          leadId={notesLead.id}
          agentId={notesLead.agentId}
          leadName={notesLead.name}
        />
      )}

      {summaryLead && (
        <AddSummaryModal
          isOpen={true}
          onClose={() => setSummaryLead(null)}
          leadId={summaryLead.id}
          leadName={summaryLead.name}
          currentSummary={summaryLead.summary}
        />
      )}

      <ConfirmDialog
        isOpen={!!leadToDelete}
        title={t('leads.delete_confirm_title')}
        message={t('leads.delete_confirm_message')}
        confirmText={t('leads.delete_confirm_button')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setLeadToDelete(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* Export Modals */}
      <ExportLeadsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        agentId={agentId || ''}
        filters={{
          status: filters.status !== 'all' ? filters.status : undefined,
          search: filters.search || undefined,
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
        }}
        onExportCreated={handleExportCreated}
      />

      <ExportProgressModal
        isOpen={!!exportJobId}
        onClose={handleCloseExportProgress}
        jobId={exportJobId}
      />

      {/* Lead Settings Modal */}
      <LeadSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Custom Field Schema Modal */}
      <CustomFieldSchemaModal
        isOpen={isCustomFieldSchemaModalOpen}
        onClose={() => setIsCustomFieldSchemaModalOpen(false)}
      />

      {/* Status Editor Modal */}
      <StatusEditorModal
        isOpen={isStatusEditorOpen}
        onClose={() => setIsStatusEditorOpen(false)}
      />
    </div>
  );
}
