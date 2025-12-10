/**
 * LeadsPage Component
 * Main leads management page with stats, filters, and data table
 * Follows Knowledge Base/Studio page architecture
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Copy, MessageSquare, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useLeads, useLeadStatistics, useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { InlineEditField } from '@/components/ui/InlineEditField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import LeadStatsCards from '../components/LeadStatsCards';
import AddLeadModal from '../components/AddLeadModal';
import LeadDetailsDrawer from '../components/LeadDetailsDrawer';
import { LeadCommentsModal } from '../components/LeadCommentsModal';
import { AddSummaryModal } from '../components/AddSummaryModal';
import ConversationViewDrawer from '@/features/conversations/components/ConversationViewDrawer';
import { validateName, validatePhone } from '../utils/validation';
import { extractNameFromEmail, formatCommentDate, formatPhoneNumber, getCommentAuthorName } from '../utils/formatting';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { Lead, LeadStatus } from '../types';

export default function LeadsPage() {
  const { isAgentSelected } = useAgentContext();
  const user = useAuthStore((state) => state.user);

  // Modal/Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [openInEditMode, setOpenInEditMode] = useState(false);
  const [commentsLead, setCommentsLead] = useState<{ id: string; name: string } | null>(null);
  const [summaryLead, setSummaryLead] = useState<{ id: string; name: string; summary: string } | null>(null);

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
  const deleteMutation = useDeleteLead();

  // Handle status change with optimistic updates (instant UI feedback)
  const handleStatusChange = useCallback((leadId: string, newStatus: LeadStatus, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation(); // Prevent row click

    // Optimistic update - UI changes instantly, rollback on error
    updateMutation.mutate({
      leadId,
      request: { status: newStatus },
    });
  }, [updateMutation]);

  // Handle name save
  const handleNameSave = useCallback(async (leadId: string, newName: string) => {
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        {
          leadId,
          request: { name: newName },
        },
        {
          onSuccess: () => {
            toast.success('Lead name updated');
            resolve();
          },
          onError: (error) => {
            toast.error('Failed to update name');
            reject(error);
          },
        }
      );
    });
  }, [updateMutation]);

  // Handle phone save
  const handlePhoneSave = useCallback(async (leadId: string, newPhone: string) => {
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        {
          leadId,
          request: { phone: newPhone },
        },
        {
          onSuccess: () => {
            toast.success('Lead phone updated');
            resolve();
          },
          onError: (error) => {
            toast.error('Failed to update phone');
            reject(error);
          },
        }
      );
    });
  }, [updateMutation]);

  // Handle summary save
  const handleSummarySave = useCallback(async (leadId: string, newSummary: string) => {
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        {
          leadId,
          request: { notes: newSummary.trim() || undefined },
        },
        {
          onSuccess: () => {
            toast.success('Summary updated');
            resolve();
          },
          onError: (error) => {
            toast.error('Failed to update summary');
            reject(error);
          },
        }
      );
    });
  }, [updateMutation]);

  // Handle phone copy (copies formatted phone number)
  const handleCopyPhone = useCallback((phone: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    const formattedPhone = formatPhoneNumber(phone);
    navigator.clipboard.writeText(formattedPhone).then(() => {
      toast.success('Copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  }, []);

  // Handle edit click
  const handleEditClick = useCallback((leadId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setOpenInEditMode(true);
    setSelectedLeadId(leadId);
  }, []);

  // Handle delete click
  const handleDeleteClick = useCallback((leadId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setLeadToDelete(leadId);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(() => {
    if (!leadToDelete) return;

    deleteMutation.mutate(leadToDelete, {
      onSuccess: () => {
        setLeadToDelete(null);
      },
    });
  }, [leadToDelete, deleteMutation]);

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

                  return (
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-neutral-700">
                          {initial}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 min-w-0">
                        {/* Inline editable name */}
                        <InlineEditField
                          value={lead.name}
                          fieldName="Name"
                          placeholder="Enter lead name"
                          onSave={(newName) => handleNameSave(lead.id, newName)}
                          validationFn={validateName}
                          isLoading={updateMutation.isPending}
                        />

                        {/* Inline editable phone */}
                        <div className="flex items-center gap-1.5 group">
                          {lead.phone && (
                            <button
                              onClick={(e) => handleCopyPhone(lead.phone!, e)}
                              className="p-1 hover:bg-neutral-100 rounded transition-all order-1"
                              title="Copy phone number"
                            >
                              <Copy className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700" />
                            </button>
                          )}
                          <div className="order-0">
                            <InlineEditField
                              value={lead.phone}
                              fieldName="Phone"
                              placeholder="Enter phone number"
                              onSave={(newPhone) => handlePhoneSave(lead.id, newPhone)}
                              validationFn={validatePhone}
                              isPhone={true}
                              isLoading={updateMutation.isPending}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'notes',
                label: 'Summary',
                sortable: false,
                render: (_, lead: Lead) => {
                  const maxLength = 120; // Approximate 2 lines
                  const shouldTruncate = lead.notes && lead.notes.length > maxLength;
                  const displayText = shouldTruncate
                    ? lead.notes.substring(0, maxLength)
                    : lead.notes;

                  return (
                    <div className="py-1 max-w-sm min-w-0">
                      {lead.notes ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSummaryLead({ id: lead.id, name: lead.name || 'Unnamed Lead', summary: lead.notes || '' });
                          }}
                          className="text-left w-full group hover:text-neutral-900 transition-colors min-w-0"
                        >
                          <div className="text-sm text-neutral-700 leading-relaxed break-words whitespace-normal">
                            {displayText}
                            {shouldTruncate && (
                              <span className="text-neutral-400 group-hover:text-neutral-900"> ...view more</span>
                            )}
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSummaryLead({ id: lead.id, name: lead.name || 'Unnamed Lead', summary: '' });
                          }}
                          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          Add summary
                        </button>
                      )}
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
                    className={`px-3 py-1.5 text-sm font-medium bg-transparent rounded-md hover:bg-neutral-50 focus:outline-none transition-colors cursor-pointer appearance-none ${
                      lead.status === 'new' ? 'text-[#00D084]' : 'text-neutral-950'
                    }`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.25em 1.25em',
                      paddingRight: '2.5rem'
                    }}
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
                    // Parse as UTC if string doesn't end with 'Z'
                    const dateStr = lead.createdAt.toString();
                    const date = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`);
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
                key: 'comments',
                label: 'Comments',
                sortable: false,
                render: (_, lead: Lead) => {
                  // Get the most recent user comment (exclude status updates)
                  const latestComment = lead.comments && lead.comments.length > 0
                    ? [...lead.comments]
                        .filter(comment => comment.commentType === 'user_comment')
                        .sort((a, b) =>
                          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        )[0]
                    : null;

                  return (
                    <div className="py-1 max-w-xs">
                      {latestComment ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCommentsLead({ id: lead.id, name: lead.name || 'Unnamed Lead' });
                          }}
                          className="text-left w-full hover:bg-neutral-50 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] text-neutral-900 truncate">
                              {latestComment.text}
                            </span>
                            <span className="text-[12px] text-neutral-500">
                              {getCommentAuthorName(latestComment.userName, latestComment.userId, user?.id)} · {formatCommentDate(latestComment.createdAt, true)}
                            </span>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCommentsLead({ id: lead.id, name: lead.name || 'Unnamed Lead' });
                          }}
                          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          Add comment
                        </button>
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'actions' as keyof Lead,
                label: '',
                sortable: false,
                render: (_, lead: Lead) => (
                  <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                    {/* Conversation Icon - only show if conversationId exists */}
                    {lead.conversationId ? (
                      <button
                        onClick={(e) => handleViewConversation(lead.conversationId!, e)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
                        title="View conversation"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-8 h-8" />
                    )}

                    {/* Edit Icon */}
                    <button
                      onClick={(e) => handleEditClick(lead.id, e)}
                      className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
                      title="Edit lead"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete Icon */}
                    <button
                      onClick={(e) => handleDeleteClick(lead.id, e)}
                      className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
                      title="Delete lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            onRowClick={(lead) => {
              setOpenInEditMode(false);
              setSelectedLeadId(lead.id);
            }}
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
        <LeadDetailsDrawer
          leadId={selectedLeadId}
          onClose={() => {
            setSelectedLeadId(null);
            setOpenInEditMode(false);
          }}
          initialEditMode={openInEditMode}
        />
      )}

      {/* Conversation View Drawer */}
      <ConversationViewDrawer
        conversationId={selectedConversationId}
        isOpen={!!selectedConversationId}
        onClose={() => setSelectedConversationId(null)}
      />

      {/* Comments Modal */}
      {commentsLead && (
        <LeadCommentsModal
          isOpen={true}
          onClose={() => setCommentsLead(null)}
          leadId={commentsLead.id}
          leadName={commentsLead.name}
        />
      )}

      {/* Summary Modal */}
      {summaryLead && (
        <AddSummaryModal
          isOpen={true}
          onClose={() => setSummaryLead(null)}
          leadId={summaryLead.id}
          leadName={summaryLead.name}
          currentSummary={summaryLead.summary}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!leadToDelete}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setLeadToDelete(null)}
        isLoading={deleteMutation.isPending}
      />
    </motion.div>
  );
}
