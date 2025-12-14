/**
 * LeadsTableView Component
 * Isolated table view with smooth data transitions
 * Only this component re-renders when data changes
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Copy, MessageSquare, Pencil, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { InlineEditField } from '@/components/ui/InlineEditField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { LeadsTableSkeleton } from './LeadsTableSkeleton';
import { validateName, validatePhone } from '../utils/validation';
import { formatPhoneNumber, getNoteAuthorName, formatNoteDate } from '../utils/formatting';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { Lead, LeadStatus, LeadFilters } from '../types';

interface LeadsTableViewProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  filters: LeadFilters;
  onEditClick: (leadId: string) => void;
  onDeleteClick: (leadId: string) => void;
  onViewConversation: (conversationId: string) => void;
  onAddLeadClick: () => void;
  onAddNoteClick: (leadId: string, name: string) => void;
  onAddSummaryClick: (leadId: string, name: string, summary: string) => void;
}

export function LeadsTableView({
  leads,
  isLoading,
  isFetching,
  error,
  filters,
  onEditClick,
  onDeleteClick,
  onViewConversation,
  onAddLeadClick,
  onAddNoteClick,
  onAddSummaryClick,
}: LeadsTableViewProps) {
  const user = useAuthStore((state) => state.user);
  const updateMutation = useUpdateLead();

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Displayed leads with infinite scroll
  const displayedLeads = useMemo(() => {
    return leads?.slice(0, displayCount);
  }, [leads, displayCount]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(50);
  }, [filters]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight * 0.8) {
        if (!isLoadingMore && leads && displayCount < leads.length) {
          setIsLoadingMore(true);
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

  // Event handlers
  const handleStatusChange = useCallback((leadId: string, newStatus: LeadStatus, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    updateMutation.mutate({
      leadId,
      request: { status: newStatus },
    });
  }, [updateMutation]);

  const handleNameSave = useCallback(async (leadId: string, newName: string) => {
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        { leadId, request: { name: newName } },
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

  const handlePhoneSave = useCallback(async (leadId: string, newPhone: string) => {
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        { leadId, request: { phone: newPhone } },
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

  const handleCopyPhone = useCallback((phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const formattedPhone = formatPhoneNumber(phone);
    navigator.clipboard.writeText(formattedPhone).then(() => {
      toast.success('Copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  }, []);

  // Show skeleton only on initial load
  if (isLoading) {
    return <LeadsTableSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12">
        <EmptyState
          icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
          title="Error Loading Leads"
          description="There was an error loading leads. Please try again."
        />
      </div>
    );
  }

  // Determine if we have filters active
  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo;

  // Empty state
  if (!leads || leads.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12">
        <EmptyState
          icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
          title={hasActiveFilters ? 'No leads found' : 'No leads yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your filters or search query'
              : 'Add your first lead to get started tracking potential customers'
          }
          action={
            !hasActiveFilters ? (
              <Button onClick={onAddLeadClick}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: '25%',
      render: (_: unknown, lead: Lead) => {
        return (
          <div className="flex flex-col gap-1.5 py-1">
            <InlineEditField
              value={lead.name}
              fieldName="Name"
              placeholder="Enter lead name"
              onSave={(newName) => handleNameSave(lead.id, newName)}
              validationFn={validateName}
              isLoading={updateMutation.isPending}
            />
            <div className="flex items-center gap-1.5 group">
              {lead.phone ? (
                <>
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[13px] text-neutral-600 hover:text-neutral-900 transition-colors order-0"
                  >
                    {formatPhoneNumber(lead.phone)}
                  </a>
                  <button
                    onClick={(e) => handleCopyPhone(lead.phone!, e)}
                    className="p-1 hover:bg-neutral-100 rounded transition-all order-1"
                    title="Copy phone number"
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700" />
                  </button>
                </>
              ) : (
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
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'summary',
      label: 'Summary',
      sortable: false,
      width: '30%',
      cellClassName: 'w-[30%]',
      render: (_: unknown, lead: Lead) => {
        const maxLength = 120;
        const shouldTruncate = lead.summary && lead.summary.length > maxLength;
        const displayText = shouldTruncate ? lead.summary.substring(0, maxLength) : lead.summary;

        return (
          <div className="py-1 max-w-sm min-w-0">
            {lead.summary ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSummaryClick(lead.id, lead.name || 'Unnamed Lead', lead.summary || '');
                }}
                className="text-left w-full group hover:text-neutral-900 transition-colors min-w-0"
              >
                <div className="text-sm text-neutral-700 leading-relaxed break-words whitespace-normal">
                  {displayText}
                  {shouldTruncate && <span className="text-neutral-400 group-hover:text-neutral-900"> ...view more</span>}
                </div>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSummaryClick(lead.id, lead.name || 'Unnamed Lead', '');
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
      width: '180px',
      cellClassName: 'w-[180px]',
      render: (_: unknown, lead: Lead) => (
        <select
          value={lead.status}
          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus, e)}
          onClick={(e) => e.stopPropagation()}
          className={`px-3 py-1.5 text-sm font-medium bg-transparent rounded-md hover:bg-neutral-50 focus:outline-none transition-colors cursor-pointer appearance-none w-full ${
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
      width: '14%',
      cellClassName: 'w-[14%]',
      render: (_: unknown, lead: Lead) => {
        try {
          const dateStr = lead.createdAt.toString();
          const date = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`);
          if (isNaN(date.getTime())) return <span className="text-neutral-700">—</span>;

          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-neutral-900">{date.toLocaleDateString()}</span>
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
      width: '18%',
      cellClassName: 'w-[18%]',
      render: (_: unknown, lead: Lead) => {
        const latestNote = lead.notes && lead.notes.length > 0
          ? [...lead.notes]
              .filter(note => note.noteType === 'user_note')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
          : null;

        return (
          <div className="py-1 max-w-xs">
            {latestNote ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNoteClick(lead.id, lead.name || 'Unnamed Lead');
                }}
                className="text-left w-full hover:bg-neutral-50 -mx-2 px-2 py-1 rounded transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] text-neutral-900 truncate">{latestNote.text}</span>
                  <span className="text-[12px] text-neutral-500">
                    {getNoteAuthorName(latestNote.userName, latestNote.userId, user?.id)} · {formatNoteDate(latestNote.createdAt, true)}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNoteClick(lead.id, lead.name || 'Unnamed Lead');
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
      width: '140px',
      cellClassName: 'text-right pr-6',
      render: (_: unknown, lead: Lead) => (
        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-1">
          {lead.conversationId ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewConversation(lead.conversationId!);
              }}
              className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
              title="View conversation"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 h-8" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(lead.id);
            }}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
            title="Edit lead"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(lead.id);
            }}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
            title="Delete lead"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Table with smooth content transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`leads-${filters.search}-${filters.status}-${filters.dateFrom}-${filters.dateTo}`}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.7 }}
          transition={{ duration: 0.15 }}
          className="relative"
        >
          <div className="relative bg-white rounded-lg border border-neutral-200">
            {/* Subtle loading overlay during filter changes */}
            {isFetching && !isLoading && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-neutral-200 shadow-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-600" />
                  <span className="text-xs text-neutral-600 font-medium">Updating...</span>
                </div>
              </div>
            )}

            <DataTable
              data={displayedLeads || []}
              rowKey="id"
              paginated={false}
              columns={columns}
            />
          </div>
        </motion.div>
      </AnimatePresence>

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
          <span className="text-sm text-neutral-500">All {leads.length} leads loaded</span>
        </div>
      )}
    </>
  );
}
