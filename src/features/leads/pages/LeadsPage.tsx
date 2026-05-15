/**
 * LeadsPage Component - Refactored for Performance
 * Architecture: Isolated components prevent unnecessary re-renders
 * - BaseHeader: Static, never re-renders
 * - LeadsFiltersToolbar: Only re-renders when filter state changes
 * - LeadsTableView: Only re-renders when data changes
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useInfiniteLeads } from '../hooks/useLeads';
import { useLeadsSubscription } from '../hooks/useLeadsSubscription';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserPlus, Plus, Download, MoreVertical, Columns3, Bot, ListChecks } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LeadsFiltersToolbar } from '../components/LeadsFiltersToolbar';
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
import type { LeadFilters, LeadStatus, DatePreset } from '../types';
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
  const [notesLead, setNotesLead] = useState<{ id: string; name: string; agentId: string } | null>(null);
  const [summaryLead, setSummaryLead] = useState<{ id: string; name: string; summary: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCustomFieldSchemaModalOpen, setIsCustomFieldSchemaModalOpen] = useState(false);
  const [isStatusEditorOpen, setIsStatusEditorOpen] = useState(false);

  // Filter state — `filters` is what's actually applied to the query;
  // `searchInput` is the local debounced buffer for the search box so each
  // keystroke doesn't refetch.
  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    status: 'all',
    dateFrom: undefined,
    dateTo: undefined,
  });
  const [searchInput, setSearchInput] = useState('');
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [activeDatePreset, setActiveDatePreset] = useState<DatePreset | null>(null);

  // Debounce search input (500ms after typing stops) — matches
  // AdminSubscriptionsPage behavior exactly.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        setFilters((prev) => ({ ...prev, search: searchInput }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search]);

  // Fetch data with filters (server-side pagination + filtering)
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
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

  // Filter handlers — applied directly to `filters` (no separate drawer state).
  const handleStatusChange = useCallback((status: LeadStatus | 'all') => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const handleAssigneeChange = useCallback((next: import('../types').AssigneeFilter | 'all') => {
    setFilters((prev) => ({
      ...prev,
      // 'all' / null means "no filter" — store undefined to skip the query param.
      assignedTo: next === 'all' || next == null ? undefined : next,
    }));
  }, []);

  const handleFilterPopoverToggle = useCallback(() => {
    setIsFilterPopoverOpen((v) => !v);
  }, []);

  const handleFilterPopoverClose = useCallback(() => {
    setIsFilterPopoverOpen(false);
  }, []);

  const handleDateFilterApply = useCallback(
    (preset: DatePreset, dateFrom?: string, dateTo?: string) => {
      setActiveDatePreset(preset);
      setFilters((prev) => ({ ...prev, dateFrom, dateTo }));
      setIsFilterPopoverOpen(false);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    setActiveDatePreset(null);
    setFilters({
      search: '',
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      assignedTo: undefined,
    });
  }, []);

  // Edit action on a row just opens the drawer — every field is inline-editable,
  // so there is no separate "edit mode" anymore.
  const handleEditClick = useCallback((leadId: string) => {
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

  // More-menu button — Add Lead is promoted to the header's primaryAction,
  // so it's not duplicated here.
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
  ), [handleExportClick, handleAddColumnClick, handleEditStatusClick, t]);

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
    // Fixed-height table mode (Linear / Notion / Airtable pattern):
    //   - Page becomes a flex column that fills <main>'s height
    //   - Header + filters stay at their natural height at the top
    //     (flex-shrink-0 so they never compress)
    //   - <LeadsTableView /> uses flex-1 + min-h-0 to absorb the rest, and
    //     the table scrolls internally (both axes) inside that bounded box.
    // h-full needs <main> to be h-full too — DashboardLayout already is.
    <div className="p-6 h-full flex flex-col gap-6 min-h-0">
      {/* Header — Add Lead is the primary action, more-menu hosts secondary
          actions (Export, Edit columns, Edit statuses, AI instructions).
          shrink-0 so this row never gets compressed by the flex layout when
          the viewport is short. */}
      <div className="flex-shrink-0">
        <BaseHeader
          title={t('leads.title')}
          subtitle={t('leads.subtitle')}
          primaryAction={{
            label: t('leads.add_lead'),
            icon: Plus,
            onClick: handleAddLeadClick,
          }}
          additionalActions={moreMenuButton}
        />
      </div>

      {/* Inline filter strip — debounced search + status dropdown + date
          popover + active-filter pills. Matches AdminSubscriptionsPage UX. */}
      <div className="flex-shrink-0">
        <LeadsFiltersToolbar
          filters={filters}
          searchInput={searchInput}
          activeDatePreset={activeDatePreset}
          isFilterPopoverOpen={isFilterPopoverOpen}
          onSearchInputChange={setSearchInput}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
          onFilterPopoverToggle={handleFilterPopoverToggle}
          onFilterPopoverClose={handleFilterPopoverClose}
          onDateFilterApply={handleDateFilterApply}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Table View - only re-renders when data changes */}
      <LeadsTableView
        leads={leads}
        isLoading={isLoading}
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
      />

      {/* Modals & Drawers */}
      <AddLeadModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Stay mounted across the close transition so SideDrawer's
          AnimatePresence can play the slide-out animation. Conditionally
          mounting on `selectedLeadId` would unmount the drawer instantly
          and skip the exit. */}
      <LeadDetailsDrawer
        leadId={selectedLeadId}
        isOpen={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />

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
