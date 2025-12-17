/**
 * LeadsPage Component - Refactored for Performance
 * Architecture: Isolated components prevent unnecessary re-renders
 * - LeadsPageHeader: Static, never re-renders
 * - LeadsFiltersToolbar: Only re-renders when filter state changes
 * - LeadsTableView: Only re-renders when data changes
 */

import { useState, useCallback } from 'react';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useLeads } from '../hooks/useLeads';
import { useLeadsSubscription } from '../hooks/useLeadsSubscription';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserPlus } from 'lucide-react';
import { LeadsPageHeader } from '../components/LeadsPageHeader';
import { LeadsFilterDrawer } from '../components/LeadsFilterDrawer';
import { LeadsTableView } from '../components/LeadsTableView';
import AddLeadModal from '../components/AddLeadModal';
import LeadDetailsDrawer from '../components/LeadDetailsDrawer';
import { LeadNotesModal } from '../components/LeadNotesModal';
import { AddSummaryModal } from '../components/AddSummaryModal';
import ConversationViewDrawer from '@/features/conversations/components/ConversationViewDrawer';
import { useDeleteLead } from '../hooks/useLeads';
import type { Lead, LeadFilters } from '../types';

export default function LeadsPage() {
  const { isAgentSelected } = useAgentContext();
  const deleteMutation = useDeleteLead();

  // Modal/Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [openInEditMode, setOpenInEditMode] = useState(false);
  const [notesLead, setNotesLead] = useState<{ id: string; name: string } | null>(null);
  const [summaryLead, setSummaryLead] = useState<{ id: string; name: string; summary: string } | null>(null);

  // Filter state
  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    status: 'all',
    dateFrom: undefined,
    dateTo: undefined,
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Fetch data with filters (server-side filtering)
  const { data: leads, isLoading, error, isFetching } = useLeads(filters);

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

  const handleAddNoteClick = useCallback((leadId: string, name: string) => {
    setNotesLead({ id: leadId, name });
  }, []);

  const handleAddSummaryClick = useCallback((leadId: string, name: string, summary: string) => {
    setSummaryLead({ id: leadId, name, summary });
  }, []);

  // ========================================
  // Render Logic
  // ========================================

  // No agent selected
  if (!isAgentSelected) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <EmptyState
          icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
          title="No Agent Selected"
          description="Please select an agent to view and manage clients"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Static Header with Filter Button - never re-renders */}
      <LeadsPageHeader
        activeFilterCount={activeFilterCount}
        onAddClick={handleAddLeadClick}
        onFilterClick={handleFilterDrawerToggle}
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
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setLeadToDelete(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
