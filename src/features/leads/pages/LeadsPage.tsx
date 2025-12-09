/**
 * LeadsPage Component
 * Main leads management page with stats, filters, and data table
 * Follows Knowledge Base/Studio page architecture
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useLeads, useLeadStatistics, useUpdateLead } from '../hooks/useLeads';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import LeadStatsCards from '../components/LeadStatsCards';
import AddLeadModal from '../components/AddLeadModal';
import LeadDetailsDrawer from '../components/LeadDetailsDrawer';
import type { Lead, LeadStatus } from '../types';

export default function LeadsPage() {
  const { agentId, isAgentSelected } = useAgentContext();

  // Modal/Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  // Fetch data
  const { data: leads, isLoading, error } = useLeads();
  const { data: stats } = useLeadStatistics();
  const updateMutation = useUpdateLead();

  // Handle status change (memoized to prevent re-renders)
  const handleStatusChange = useCallback((leadId: string, newStatus: LeadStatus, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation(); // Prevent row click

    // Store current value for rollback
    const previousStatus = leads?.find(l => l.id === leadId)?.status;

    updateMutation.mutate(
      {
        leadId,
        request: { status: newStatus },
      },
      {
        onSuccess: () => {
          toast.success('Lead status updated');
        },
        onError: () => {
          toast.error('Failed to update status');
          // On error, reset the select to previous value
          // This will happen automatically when React Query refetches
        },
      }
    );
  }, [updateMutation, leads]);

  // Client-side filtering (memoized for performance)
  const filteredLeads = useMemo(() => {
    return leads?.filter((lead) => {
      // If no search query, match all
      const matchesSearch = searchQuery.trim() === '' ||
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  // No agent selected
  if (!isAgentSelected) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <EmptyState
          icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
          title="No Agent Selected"
          description="Please select an agent to view and manage leads"
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <EmptyState
          icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
          title="Error Loading Leads"
          description="There was an error loading leads. Please try again."
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Leads</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage and track your leads for this agent
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && <LeadStatsCards stats={stats} />}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table or Empty State */}
      {filteredLeads && filteredLeads.length > 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200">
          <DataTable
            data={filteredLeads}
            rowKey="id"
            columns={[
              {
                key: 'name',
                label: 'Name',
                sortable: true,
                render: (_, lead: Lead) => {
                  // Extra defensive check for null/undefined
                  if (!lead) return <span>—</span>;
                  const initial = lead?.name ? String(lead.name).charAt(0).toUpperCase() : '?';
                  const displayName = lead?.name || '—';

                  return (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-neutral-600">
                          {initial}
                        </span>
                      </div>
                      <span className="font-medium text-neutral-900">{displayName}</span>
                    </div>
                  );
                },
              },
              {
                key: 'phone',
                label: 'Phone',
                sortable: false,
                render: (_, lead: Lead) => (
                  <span className="text-neutral-700">{lead.phone || '—'}</span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (_, lead: Lead) => (
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus, e)}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 text-sm text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors cursor-pointer"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                ),
              },
              {
                key: 'createdAt',
                label: 'Created',
                sortable: true,
                render: (_, lead: Lead) => {
                  try {
                    const date = new Date(lead.createdAt);
                    return (
                      <span className="text-neutral-700">
                        {!isNaN(date.getTime()) ? date.toLocaleDateString() : '—'}
                      </span>
                    );
                  } catch {
                    return <span className="text-neutral-700">—</span>;
                  }
                },
              },
            ]}
            onRowClick={(lead) => setSelectedLeadId(lead.id)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 p-12">
          <EmptyState
            icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
            title={searchQuery || statusFilter !== 'all' ? 'No leads found' : 'No leads yet'}
            description={
              searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Add your first lead to get started tracking potential customers'
            }
            action={
              !searchQuery && statusFilter === 'all' ? (
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {/* Modals */}
      <AddLeadModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {selectedLeadId && (
        <LeadDetailsDrawer leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      )}
    </motion.div>
  );
}
