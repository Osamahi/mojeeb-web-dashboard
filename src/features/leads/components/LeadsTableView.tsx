/**
 * LeadsTableView
 *
 * Schema-driven Clients table. Built on `DataTableV2` (TanStack Table v8),
 * which owns the row/column/visibility/pinning state. This component is the
 * data-fetching + handler-wiring shell:
 *
 *   - `useLeadTableColumns` builds the column definitions (system + custom
 *     fields + actions) from the agent's `custom_field_schemas`
 *   - `useInfiniteLeads` (called by the parent) provides the data; we wire
 *     the infinite-scroll sentinel here via `useInfiniteScroll`
 *   - Inline editing, status changes, and copy-phone are handled by the
 *     existing `SystemFieldRenderContext` plumbing
 *
 * Pinning: Name is pinned to the left (row identity), Actions to the right
 * (always reachable during horizontal scroll). Sticky behavior + edge fade
 * shadows + density + column chooser all come from `DataTableV2`.
 */

import { useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateLead } from '../hooks/useLeads';
import { DataTableV2 } from '@/components/ui/DataTableV2';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { LeadsTableSkeleton } from './LeadsTableSkeleton';
import { formatPhoneNumber } from '../utils/formatting';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useDateLocale } from '@/lib/dateConfig';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useLeadTableColumns } from '../hooks/useLeadTableColumns';
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
  isFetching: _isFetching,
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
  const _user = useAuthStore((state) => state.user);
  const updateMutation = useUpdateLead();
  const { formatSmartTimestamp } = useDateLocale();

  // Stable refs prevent callback recreation in render context.
  const mutateLeadRef = useRef(updateMutation.mutate);
  mutateLeadRef.current = updateMutation.mutate;
  const tRef = useRef(t);
  tRef.current = t;

  // Server-side infinite scroll handler — same selector as before.
  useInfiniteScroll({
    fetchNextPage,
    hasMore,
    isFetching: isFetchingNextPage,
    containerSelector: '[data-leads-container]',
  });

  // Cell-level handlers — same plumbing as the old table.
  const handleStatusChange = useCallback((leadId: string, newStatus: LeadStatus) => {
    mutateLeadRef.current({ leadId, request: { status: newStatus } });
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
          onError: (err) => {
            toast.error(tRef.current('leads.update_failed_name'));
            reject(err);
          },
        },
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
          onError: (err) => {
            toast.error(tRef.current('leads.update_failed_phone'));
            reject(err);
          },
        },
      );
    });
  }, []);

  const handleCopyPhone = useCallback((phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const formatted = formatPhoneNumber(phone);
    navigator.clipboard
      .writeText(formatted)
      .then(() => toast.success(tRef.current('leads.copied_to_clipboard')))
      .catch(() => toast.error(tRef.current('leads.failed_to_copy')));
  }, []);

  // Render context shared with the system-field cell renderers.
  const ctx = useMemo<SystemFieldRenderContext>(() => ({
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
  }), [
    t,
    i18n.language,
    formatSmartTimestamp,
    handleNameSave,
    handlePhoneSave,
    handleCopyPhone,
    onAddSummaryClick,
    handleStatusChange,
    onAddNoteClick,
    updateMutation.isPending,
  ]);

  const { columns, pinning, isLoading: isColumnsLoading } = useLeadTableColumns({
    ctx,
    onViewConversation,
    onEditClick,
    onDeleteClick,
  });

  // ============================================================
  // Render
  // ============================================================

  if (isLoading || isColumnsLoading) {
    return <LeadsTableSkeleton />;
  }

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

  const hasActiveFilters =
    filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo;

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

  return (
    <div data-leads-container>
      <DataTableV2<Lead>
        tableId="leads"
        data={leads}
        columns={columns}
        initialColumnPinning={pinning}
        initialDensity="regular"
        // Clients table doesn't expose density / column-chooser controls — all
        // columns are shown by default, density stays at Regular.
        showColumnChooser={false}
        showDensityToggle={false}
        footer={
          <>
            {isFetchingNextPage && (
              <div className="border-t border-neutral-100">
                <LeadsTableSkeleton rows={3} showHeader={false} />
              </div>
            )}
            {!hasMore && leads.length > 50 && (
              <div className="flex justify-center items-center py-4 border-t border-neutral-100">
                <span className="text-sm text-neutral-500">
                  {t('leads.all_leads_loaded', { count: leads.length })}
                </span>
              </div>
            )}
          </>
        }
      />
    </div>
  );
}
