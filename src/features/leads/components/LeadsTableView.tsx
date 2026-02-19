/**
 * LeadsTableView Component
 * Responsive view: Desktop table / Mobile cards
 * Schema-driven columns from custom_field_schemas
 */

import { useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Pencil, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateLead } from '../hooks/useLeads';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { LeadsTableSkeleton } from './LeadsTableSkeleton';
import { LeadsMobileCardView } from './LeadsMobileCardView';
import { formatPhoneNumber } from '../utils/formatting';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useDateLocale } from '@/lib/dateConfig';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useCustomFieldColumns, useSystemFieldColumns } from '../hooks/useCustomFieldColumns';
import type { SystemFieldRenderContext } from '../utils/systemFieldRenderers';
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
  onAddNoteClick: (leadId: string, name: string, agentId: string) => void;
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
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const updateMutation = useUpdateLead();
  const isMobile = useIsMobile();
  const { formatSmartTimestamp } = useDateLocale();

  // ✅ PERFORMANCE FIX: Create stable refs to prevent callback recreation
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
  }, []);

  // Mobile view uses simplified signature (no event parameter)
  const handleStatusChangeMobile = useCallback((leadId: string, newStatus: LeadStatus) => {
    mutateLeadRef.current({
      leadId,
      request: { status: newStatus },
    });
  }, []);

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
  }, []);

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
  }, []);

  const handleCopyPhone = useCallback((phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const formattedPhone = formatPhoneNumber(phone);
    navigator.clipboard.writeText(formattedPhone).then(() => {
      toast.success(tRef.current('leads.copied_to_clipboard'));
    }).catch(() => {
      toast.error(tRef.current('leads.failed_to_copy'));
    });
  }, []);

  const handleCardClick = useCallback((lead: Lead) => {
    onEditClick(lead.id);
  }, [onEditClick]);

  // ============================================================
  // Schema-driven columns (single source of truth)
  // ============================================================

  // Build render context for system field specialized renderers
  const systemFieldRenderCtx = useMemo<SystemFieldRenderContext>(() => ({
    t,
    locale: i18n.language,
    formatSmartTimestamp,
    onNameSave: handleNameSave,
    onPhoneSave: handlePhoneSave,
    onCopyPhone: handleCopyPhone,
    onAddSummaryClick,
    onStatusChange: handleStatusChange,
    onAddNoteClick,
    isUpdating: updateMutation.isPending,
  }), [t, i18n.language, formatSmartTimestamp, onAddSummaryClick, onAddNoteClick, updateMutation.isPending]);

  // Fetch non-system custom field columns (generic renderers)
  const {
    columns: customFieldColumns,
    isLoading: isCustomFieldsLoading,
  } = useCustomFieldColumns();

  // Fetch system field columns (specialized renderers)
  const {
    systemColumns,
    isLoading: isSystemFieldsLoading,
  } = useSystemFieldColumns(systemFieldRenderCtx);

  // Actions column
  const actionsColumn = useMemo(() => ({
    key: 'actions' as keyof Lead,
    label: '',
    sortable: false,
    width: '140px',
    cellClassName: 'text-end pe-6',
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
  }), [t, onViewConversation, onEditClick, onDeleteClick]);

  // Schema-driven columns: system + custom + actions
  const columns = useMemo(() => {
    return [...systemColumns, ...customFieldColumns, actionsColumn];
  }, [systemColumns, customFieldColumns, actionsColumn]);

  // Show skeleton only on initial load
  if (isLoading || isCustomFieldsLoading || isSystemFieldsLoading) {
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
      <div className="relative">
        <div className="relative bg-white rounded-lg border border-neutral-200">
          <DataTable
            data={leads || []}
            rowKey="id"
            paginated={false}
            columns={columns}
          />
        </div>
      </div>

      {/* Loading More Indicator (server-side pagination) */}
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
