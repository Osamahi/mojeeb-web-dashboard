/**
 * LeadsPage Component
 * Main leads management page with stats, filters, and data table
 * Follows Knowledge Base/Studio page architecture
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Copy, MessageSquare, Loader2 } from 'lucide-react';
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
import ConversationViewDrawer from '@/features/conversations/components/ConversationViewDrawer';
import type { Lead, LeadStatus } from '../types';

export default function LeadsPage() {
  const { agentId, isAgentSelected } = useAgentContext();

  // Modal/Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  // Handle phone copy
  const handleCopyPhone = useCallback((phone: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    navigator.clipboard.writeText(phone).then(() => {
      toast.success('Phone number copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy phone number');
    });
  }, []);

  // Handle view conversation
  const handleViewConversation = useCallback((conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setSelectedConversationId(conversationId);
  }, []);

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

  // Displayed leads with infinite scroll
  const displayedLeads = useMemo(() => {
    return filteredLeads?.slice(0, displayCount);
  }, [filteredLeads, displayCount]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(50);
  }, [searchQuery, statusFilter]);

  // Infinite scroll handler - using window scroll
  useEffect(() => {
    const handleScroll = () => {
      // Check if we're near the bottom of the page
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Load more when scrolled to 80% of the way down
      if (scrollTop + windowHeight >= documentHeight * 0.8) {
        if (!isLoadingMore && filteredLeads && displayCount < filteredLeads.length) {
          setIsLoadingMore(true);

          // Simulate loading delay for smooth UX
          setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + 50, filteredLeads.length));
            setIsLoadingMore(false);
          }, 300);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayCount, filteredLeads, isLoadingMore]);

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
        <>
          <div className="bg-white rounded-lg border border-neutral-200">
            <DataTable
              data={displayedLeads || []}
              rowKey="id"
              paginated={false}
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
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-neutral-700">
                          {initial}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[15px] font-medium text-neutral-900 leading-tight">{displayName}</span>
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 group">
                            <span className="text-[13px] text-neutral-500 font-normal">{lead.phone}</span>
                            <button
                              onClick={(e) => handleCopyPhone(lead.phone!, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-100 rounded transition-all"
                              title="Copy phone number"
                            >
                              <Copy className="w-3 h-3 text-neutral-400 hover:text-neutral-700" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
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
                    if (isNaN(date.getTime())) return <span className="text-neutral-700">—</span>;

                    return (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] text-neutral-900">
                          {date.toLocaleDateString()}
                        </span>
                        <span className="text-[12px] text-neutral-500">
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  } catch {
                    return <span className="text-neutral-700">—</span>;
                  }
                },
              },
              {
                key: 'conversation',
                label: '',
                sortable: false,
                render: (_, lead: Lead) => {
                  if (!lead.conversationId) return <div className="w-10" />;

                  return (
                    <button
                      onClick={(e) => handleViewConversation(lead.conversationId!, e)}
                      className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
                      title="View conversation"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  );
                },
              },
            ]}
            onRowClick={(lead) => setSelectedLeadId(lead.id)}
          />
          </div>

          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="flex justify-center items-center py-8 bg-white rounded-lg border border-neutral-200 mt-4">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              <span className="ml-2 text-sm text-neutral-600">Loading more leads...</span>
            </div>
          )}

          {/* End of results indicator */}
          {displayedLeads && filteredLeads && displayedLeads.length >= filteredLeads.length && filteredLeads.length > 50 && (
            <div className="flex justify-center items-center py-6 bg-white rounded-lg border border-neutral-200 mt-4">
              <span className="text-sm text-neutral-500">
                All {filteredLeads.length} leads loaded
              </span>
            </div>
          )}
        </>
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

      {/* Conversation View Drawer */}
      <ConversationViewDrawer
        conversationId={selectedConversationId}
        isOpen={!!selectedConversationId}
        onClose={() => setSelectedConversationId(null)}
      />
    </motion.div>
  );
}
