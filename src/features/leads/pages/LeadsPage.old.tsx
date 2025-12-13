/**
 * LeadsPage Component
 * Main leads management page with stats, filters, and data table
 * Follows Knowledge Base/Studio page architecture
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Copy, MessageSquare, Loader2, Pencil, Trash2, X, Calendar, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useLeads, useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { useLeadsSubscription } from '../hooks/useLeadsSubscription';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { InlineEditField } from '@/components/ui/InlineEditField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import AddLeadModal from '../components/AddLeadModal';
import LeadDetailsDrawer from '../components/LeadDetailsDrawer';
import { LeadNotesModal } from '../components/LeadNotesModal';
import { AddSummaryModal } from '../components/AddSummaryModal';
import { FilterBadge } from '../components/FilterBadge';
import { FilterPopover } from '../components/FilterPopover';
import { LeadsTableSkeleton } from '../components/LeadsTableSkeleton';
import ConversationViewDrawer from '@/features/conversations/components/ConversationViewDrawer';
import { validateName, validatePhone } from '../utils/validation';
import { extractNameFromEmail, formatNoteDate, formatPhoneNumber, getNoteAuthorName } from '../utils/formatting';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { Lead, LeadStatus, LeadFilters, DatePreset } from '../types';

export default function LeadsPage() {
  const { isAgentSelected } = useAgentContext();
  const user = useAuthStore((state) => state.user);

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
  const [activeDatePreset, setActiveDatePreset] = useState<DatePreset | null>(null);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  // Search input (manual trigger on click)
  const [searchInput, setSearchInput] = useState('');

  // Handle search button click
  const handleSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, search: searchInput }));
  }, [searchInput]);

  // Handle Enter key press in search input
  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch data with filters (server-side filtering)
  const { data: leads, isLoading, error, isFetching } = useLeads(filters);
  const updateMutation = useUpdateLead();
  const deleteMutation = useDeleteLead();

  // Subscribe to real-time updates
  useLeadsSubscription();

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

  // Displayed leads with infinite scroll (server-side filtered)
  const displayedLeads = useMemo(() => {
    return leads?.slice(0, displayCount);
  }, [leads, displayCount]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(50);
  }, [filters]);

  // Infinite scroll handler - using window scroll
  useEffect(() => {
    const handleScroll = () => {
      // Check if we're near the bottom of the page
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Load more when scrolled to 80% of the way down
      if (scrollTop + windowHeight >= documentHeight * 0.8) {
        if (!isLoadingMore && leads && displayCount < leads.length) {
          setIsLoadingMore(true);

          // Simulate loading delay for smooth UX
          setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + 50, leads.length));
            setIsLoadingMore(false);
          }, 300);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayCount, leads, isLoadingMore]);

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

  // Initial loading state (page load)
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 space-y-6"
      >
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-neutral-200 rounded w-32 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded w-64 animate-pulse" />
          </div>
          <div className="h-10 bg-neutral-200 rounded w-32 animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-9 bg-neutral-200 rounded flex-1 min-w-[240px] animate-pulse" />
          <div className="h-9 bg-neutral-200 rounded w-32 animate-pulse" />
          <div className="h-9 bg-neutral-200 rounded w-28 animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <LeadsTableSkeleton />
      </motion.div>
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

      {/* Compact Inline Toolbar - Linear/Notion Style */}
      <div className="space-y-3">
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input with Inline Button */}
          <div className="flex-1 min-w-[240px] relative">
            <Input
              placeholder="Search by name or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className={`h-9 ${searchInput ? 'pr-24' : ''}`}
            />
            {searchInput && (
              <button
                onClick={handleSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 h-7 bg-black text-white rounded-md hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Search</span>
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as LeadStatus | 'all' }))}
            className="px-3 h-9 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>

          {/* Add Filter Button */}
          <div className="relative">
            <button
              onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
              className={`
                px-3 h-9 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2
                ${isFilterPopoverOpen || filters.dateFrom || filters.dateTo
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }
              `}
            >
              <Calendar className="w-4 h-4" />
              {filters.dateFrom || filters.dateTo ? 'Date Filter' : 'Add Filter'}
            </button>

            {/* Filter Popover */}
            {isFilterPopoverOpen && (
              <FilterPopover
                activePreset={activeDatePreset}
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
                onApply={(preset, dateFrom, dateTo) => {
                  setActiveDatePreset(preset);
                  setFilters(prev => ({ ...prev, dateFrom, dateTo }));
                }}
                onClose={() => setIsFilterPopoverOpen(false)}
              />
            )}
          </div>

          {/* Clear All Filters Button */}
          {(filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => {
                setSearchInput('');
                setFilters({ search: '', status: 'all', dateFrom: undefined, dateTo: undefined });
                setActiveDatePreset(null);
              }}
              className="px-3 h-9 text-sm text-neutral-600 hover:text-black transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Active Filter Pills */}
        {(filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo) && (
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <FilterBadge
                label="Search"
                value={filters.search}
                onRemove={() => {
                  setSearchInput('');
                  setFilters(prev => ({ ...prev, search: '' }));
                }}
              />
            )}
            {filters.status !== 'all' && (
              <FilterBadge
                label="Status"
                value={filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                onRemove={() => setFilters(prev => ({ ...prev, status: 'all' }))}
              />
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <FilterBadge
                label="Date"
                value={
                  activeDatePreset && activeDatePreset !== 'custom'
                    ? activeDatePreset === 'last7days'
                      ? 'Last 7 Days'
                      : activeDatePreset === 'last30days'
                      ? 'Last 30 Days'
                      : activeDatePreset === 'thisMonth'
                      ? 'This Month'
                      : activeDatePreset === 'today'
                      ? 'Today'
                      : `${filters.dateFrom || '...'} to ${filters.dateTo || '...'}`
                    : `${filters.dateFrom || '...'} to ${filters.dateTo || '...'}`
                }
                onRemove={() => {
                  setFilters(prev => ({ ...prev, dateFrom: undefined, dateTo: undefined }));
                  setActiveDatePreset(null);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Data Table or Empty State */}
      {leads && leads.length > 0 ? (
        <>
          <div className="relative bg-white rounded-lg border border-neutral-200">
            {/* Filter Loading Overlay */}
            {isFetching && !isLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-neutral-200 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                  <span className="text-sm text-neutral-600 font-medium">Filtering...</span>
                </div>
              </div>
            )}
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
                key: 'summary',
                label: 'Summary',
                sortable: false,
                render: (_, lead: Lead) => {
                  const maxLength = 120; // Approximate 2 lines
                  const shouldTruncate = lead.summary && lead.summary.length > maxLength;
                  const displayText = shouldTruncate
                    ? lead.summary.substring(0, maxLength)
                    : lead.summary;

                  return (
                    <div className="py-1 max-w-sm min-w-0">
                      {lead.summary ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSummaryLead({ id: lead.id, name: lead.name || 'Unnamed Lead', summary: lead.summary || '' });
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
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
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
                key: 'notes',
                label: 'Notes',
                sortable: false,
                render: (_, lead: Lead) => {
                  // Get the most recent user note (exclude status updates)
                  const latestNote = lead.notes && lead.notes.length > 0
                    ? [...lead.notes]
                        .filter(note => note.noteType === 'user_note')
                        .sort((a, b) =>
                          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        )[0]
                    : null;

                  return (
                    <div className="py-1 max-w-xs">
                      {latestNote ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotesLead({ id: lead.id, name: lead.name || 'Unnamed Lead' });
                          }}
                          className="text-left w-full hover:bg-neutral-50 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] text-neutral-900 truncate">
                              {latestNote.text}
                            </span>
                            <span className="text-[12px] text-neutral-500">
                              {getNoteAuthorName(latestNote.userName, latestNote.userId, user?.id)} · {formatNoteDate(latestNote.createdAt, true)}
                            </span>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotesLead({ id: lead.id, name: lead.name || 'Unnamed Lead' });
                          }}
                          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          Add note
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
          {displayedLeads && leads && displayedLeads.length >= leads.length && leads.length > 50 && (
            <div className="flex justify-center items-center py-6 bg-white rounded-lg border border-neutral-200 mt-4">
              <span className="text-sm text-neutral-500">
                All {leads.length} leads loaded
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 p-12">
          <EmptyState
            icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
            title={filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo ? 'No leads found' : 'No leads yet'}
            description={
              filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo
                ? 'Try adjusting your filters or search query'
                : 'Add your first lead to get started tracking potential customers'
            }
            action={
              !filters.search && filters.status === 'all' && !filters.dateFrom && !filters.dateTo ? (
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

      {/* Notes Modal */}
      {notesLead && (
        <LeadNotesModal
          isOpen={true}
          onClose={() => setNotesLead(null)}
          leadId={notesLead.id}
          leadName={notesLead.name}
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
