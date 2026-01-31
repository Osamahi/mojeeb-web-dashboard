/**
 * LeadsTableView Component
 * Responsive view: Desktop table / Mobile cards
 * Switches layout based on screen size
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Copy, MessageSquare, Pencil, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { InlineEditField } from '@/components/ui/InlineEditField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { LeadsTableSkeleton } from './LeadsTableSkeleton';
import { LeadsMobileCardView } from './LeadsMobileCardView';
import { LatestNoteCell } from './LatestNoteCell';
import { validateName, validatePhone } from '../utils/validation';
import { formatPhoneNumber, getNoteAuthorName } from '../utils/formatting';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useDateLocale } from '@/lib/dateConfig';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
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
  fetchNextPage: () => void;
  hasMore: boolean;
  isFetchingNextPage: boolean;
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
  fetchNextPage,
  hasMore,
  isFetchingNextPage,
}: LeadsTableViewProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const updateMutation = useUpdateLead();
  const isMobile = useIsMobile();
  const { toLocaleDateString, toLocaleTimeString, formatSmartTimestamp } = useDateLocale();

  // ✅ PERFORMANCE FIX: Create stable refs to prevent callback recreation
  // React Query mutations return new objects on every render, causing callbacks
  // with mutation in dependencies to be recreated, leading to unnecessary re-renders
  const mutateLeadRef = useRef(updateMutation.mutate);
  mutateLeadRef.current = updateMutation.mutate;

  const tRef = useRef(t);
  tRef.current = t;

  // Server-side infinite scroll handler
  useInfiniteScroll({
    fetchNextPage,
    hasMore,
    isFetching: isFetchingNextPage,
    containerSelector: '[data-leads-container]',
  });

  // Event handlers with stable references (using refs to avoid recreation)
  const handleStatusChange = useCallback((leadId: string, newStatus: LeadStatus, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    mutateLeadRef.current({
      leadId,
      request: { status: newStatus },
    });
  }, []); // ✅ Empty deps = truly stable callback

  // Mobile view uses simplified signature (no event parameter)
  const handleStatusChangeMobile = useCallback((leadId: string, newStatus: LeadStatus) => {
    mutateLeadRef.current({
      leadId,
      request: { status: newStatus },
    });
  }, []); // ✅ Empty deps = truly stable callback

  const handleNameSave = useCallback(async (leadId: string, newName: string) => {
    return new Promise<void>((resolve, reject) => {
      mutateLeadRef.current(
        { leadId, request: { name: newName } },
        {
          onSuccess: () => {
            toast.success(tRef.current('leads.lead_name_updated'));
            resolve();
          },
          onError: (error) => {
            toast.error(tRef.current('leads.update_failed_name'));
            reject(error);
          },
        }
      );
    });
  }, []); // ✅ Empty deps = truly stable callback

  const handlePhoneSave = useCallback(async (leadId: string, newPhone: string) => {
    return new Promise<void>((resolve, reject) => {
      mutateLeadRef.current(
        { leadId, request: { phone: newPhone } },
        {
          onSuccess: () => {
            toast.success(tRef.current('leads.lead_phone_updated'));
            resolve();
          },
          onError: (error) => {
            toast.error(tRef.current('leads.update_failed_phone'));
            reject(error);
          },
        }
      );
    });
  }, []); // ✅ Empty deps = truly stable callback

  const handleCopyPhone = useCallback((phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const formattedPhone = formatPhoneNumber(phone);
    navigator.clipboard.writeText(formattedPhone).then(() => {
      toast.success(tRef.current('leads.copied_to_clipboard'));
    }).catch(() => {
      toast.error(tRef.current('leads.failed_to_copy'));
    });
  }, []); // ✅ Empty deps = truly stable callback

  const handleCardClick = useCallback((lead: Lead) => {
    // Open the lead detail drawer by triggering edit
    onEditClick(lead.id);
  }, [onEditClick]);

  // Table columns configuration (only for desktop)
  // ✅ PERFORMANCE FIX: Memoize columns array to prevent recreation on every render
  // This prevents all 50+ cells from re-rendering when only one cell should update
  // NOTE: Defined here (before conditional returns) to comply with Rules of Hooks
  const columns = useMemo(() => [
    {
      key: 'name',
      label: t('leads.table_name'),
      sortable: true,
      width: '25%',
      render: (_: unknown, lead: Lead) => {
        return (
          <div className="flex flex-col gap-1.5 py-1">
            <InlineEditField
              value={lead.name}
              fieldName="Name"
              placeholder={t('leads.enter_lead_name_placeholder')}
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
                    <PhoneNumber value={lead.phone} />
                  </a>
                  <button
                    onClick={(e) => handleCopyPhone(lead.phone!, e)}
                    className="p-1 hover:bg-neutral-100 rounded transition-all order-1"
                    title={t('leads.copy_phone_title')}
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700" />
                  </button>
                </>
              ) : (
                <div className="order-0">
                  <InlineEditField
                    value={lead.phone}
                    fieldName="Phone"
                    placeholder={t('leads.enter_phone_placeholder')}
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
      label: t('leads.table_summary'),
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
                  onAddSummaryClick(lead.id, lead.name || '', lead.summary || '');
                }}
                className="ltr:text-left rtl:text-right w-full group hover:text-neutral-900 transition-colors min-w-0"
              >
                <div className="text-sm text-neutral-700 leading-relaxed break-words whitespace-normal">
                  {displayText}
                  {shouldTruncate && <span className="text-neutral-400 group-hover:text-neutral-900"> ...{t('leads.view_more')}</span>}
                </div>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSummaryClick(lead.id, lead.name || '', '');
                }}
                className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors ltr:text-left rtl:text-right w-full"
              >
                {t('leads.add_summary')}
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: t('leads.table_status'),
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
          <option value="new">{t('leads.status_new')}</option>
          <option value="processing">{t('leads.status_processing')}</option>
          <option value="completed">{t('leads.status_completed')}</option>
        </select>
      ),
    },
    {
      key: 'createdAt',
      label: t('leads.table_created'),
      sortable: true,
      width: '14%',
      cellClassName: 'w-[14%]',
      render: (_: unknown, lead: Lead) => {
        try {
          return (
            <span className="text-[13px] text-neutral-900">
              {formatSmartTimestamp(lead.createdAt)}
            </span>
          );
        } catch {
          return <span className="text-neutral-700">—</span>;
        }
      },
    },
    {
      key: 'notes',
      label: t('leads.table_notes'),
      sortable: false,
      width: '18%',
      cellClassName: 'w-[18%]',
      render: (_: unknown, lead: Lead) => (
        <LatestNoteCell lead={lead} onAddNoteClick={onAddNoteClick} />
      ),
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
              title={t('leads.view_conversation_title')}
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
            title={t('leads.edit_lead_title')}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(lead.id);
            }}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
            title={t('leads.delete_lead_title')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [
    t, // Only include `t` - render functions are closures that capture current values
    // Callbacks are stable (empty deps), so no need to include them here
    // updateMutation.isPending, user.id, etc. are captured by closures - not needed as deps
  ]);

  // Show skeleton only on initial load
  if (isLoading) {
    return (
      <div>
        {/* Mobile card skeleton (< 768px) */}
        <div className="block md:hidden space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-neutral-200 rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-5 bg-neutral-200 rounded w-32"></div>
                <div className="flex gap-1">
                  <div className="w-10 h-10 bg-neutral-200 rounded-lg"></div>
                  <div className="w-10 h-10 bg-neutral-200 rounded-lg"></div>
                </div>
              </div>
              <div className="h-4 bg-neutral-200 rounded w-40 mb-3"></div>
              <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-neutral-200 rounded w-3/4 mb-3"></div>
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <div className="h-8 bg-neutral-200 rounded w-28"></div>
                <div className="h-4 bg-neutral-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table skeleton (≥ 768px) */}
        <div className="hidden md:block">
          <LeadsTableSkeleton />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12">
        <EmptyState
          icon={<UserPlus className="w-12 h-12 text-neutral-400" />}
          title={t('leads.error_loading')}
          description={t('leads.error_loading_description')}
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
          title={hasActiveFilters ? t('leads.no_clients_found') : t('leads.no_clients_yet')}
          description={
            hasActiveFilters
              ? t('leads.no_clients_found_description')
              : t('leads.no_clients_yet_description')
          }
          action={
            !hasActiveFilters ? (
              <Button onClick={onAddLeadClick}>
                <UserPlus className="w-4 h-4 mr-2" />
                {t('leads.add_client')}
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  // Render mobile card view
  if (isMobile) {
    return (
      <LeadsMobileCardView
        leads={leads}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        filters={filters}
        onRowClick={handleCardClick}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
        onViewConversation={onViewConversation}
        onAddLeadClick={onAddLeadClick}
        onStatusChange={handleStatusChangeMobile}
        onCopyPhone={handleCopyPhone}
        isUpdating={updateMutation.isPending}
      />
    );
  }

  // Render desktop table view
  return (
    <div data-leads-container>
      {/* Table without blur overlay - updates happen seamlessly via Supabase realtime */}
      <div className="relative">
        <div className="relative bg-white rounded-lg border border-neutral-200">
          {/* NO loading overlay during refetches - causes blur effect
              Background refetches from Supabase updates should be seamless */}

          <DataTable
            data={leads || []}
            rowKey="id"
            paginated={false}
            columns={columns}
          />
        </div>
      </div>

      {/* Loading More Indicator (server-side pagination) - Smooth skeleton rows */}
      {isFetchingNextPage && (
        <div className="mt-4">
          <LeadsTableSkeleton rows={3} showHeader={false} />
        </div>
      )}

      {/* End of results indicator */}
      {!hasMore && leads && leads.length > 50 && (
        <div className="flex justify-center items-center py-6 bg-white rounded-lg border border-neutral-200 mt-4">
          <span className="text-sm text-neutral-500">{t('leads.all_leads_loaded', { count: leads.length })}</span>
        </div>
      )}
    </div>
  );
}
