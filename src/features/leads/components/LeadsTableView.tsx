/**
 * LeadsTableView
 *
 * Schema-driven Clients table. Built on `DataTableV2` (TanStack Table v8,
 * `fillHeight` mode), which owns the row/column/visibility/pinning state.
 * This component is the data-fetching + handler-wiring shell:
 *
 *   - `useLeadTableColumns` builds the column definitions (system + custom
 *     fields + actions) from the agent's `custom_field_schemas`.
 *   - `useInfiniteLeads` (called by the parent) provides the data; this
 *     component drives the IntersectionObserver-based infinite scroll
 *     against the table's own scroll container (the page itself doesn't
 *     scroll in `fillHeight` mode).
 *   - Inline editing, status changes, and copy-phone are handled by the
 *     `SystemFieldRenderContext` plumbing.
 *
 * Pinning: Name is pinned left (row identity) on desktop, Actions pinned
 * right always — sticky positioning, sticky `<thead>`, and the in-tbody
 * loading-skeleton rows all come from `DataTableV2`.
 */

import { useMemo, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAssignLead, useUpdateLead } from '../hooks/useLeads';
import { DataTableV2 } from '@/components/ui/DataTableV2';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { LeadsTableSkeleton } from './LeadsTableSkeleton';
import { formatPhoneNumber } from '../utils/formatting';
import { useDateLocale } from '@/lib/dateConfig';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useLeadTableColumns } from '../hooks/useLeadTableColumns';
import type { SystemFieldRenderContext } from '../utils/systemFieldRenderers';
import type { CustomFieldRenderContext } from '../utils/customFieldTableRenderer';
import { SchemaFieldEditModal } from './SchemaFieldEditModal';
import type { CustomFieldSchema } from '../types/customFieldSchema.types';
import type { Lead, LeadStatus, LeadFilters } from '../types';

interface LeadsTableViewProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
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
  const updateMutation = useUpdateLead();
  const assignMutation = useAssignLead();
  const { formatSmartTimestamp } = useDateLocale();

  // Stable refs so cell-level handlers don't re-create on every mutation
  // status change (would invalidate `ctx` and re-instantiate the TanStack
  // table). The refs always read the latest mutation function / translator.
  const mutateLeadRef = useRef(updateMutation.mutate);
  mutateLeadRef.current = updateMutation.mutate;
  const assignLeadRef = useRef(assignMutation.mutate);
  assignLeadRef.current = assignMutation.mutate;
  const tRef = useRef(t);
  tRef.current = t;

  // `fillHeight` table mode: the page itself doesn't scroll — the table's
  // own scroll container does. `useInfiniteScroll` must observe against
  // that element, not the viewport. A callback ref passed to DataTableV2
  // populates this state when the DOM mounts; the state change re-runs
  // the hook with a real root.
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  useInfiniteScroll({
    fetchNextPage,
    hasMore,
    isFetching: isFetchingNextPage,
    root: scrollContainer,
  });

  // Cell-level handlers — same plumbing as the old table.
  const handleStatusChange = useCallback((leadId: string, newStatus: LeadStatus) => {
    mutateLeadRef.current({ leadId, request: { status: newStatus } });
  }, []);

  const handleAssignChange = useCallback((leadId: string, newAssignee: string | null) => {
    assignLeadRef.current({ leadId, assignedTo: newAssignee });
  }, []);

  // ─── Custom-field inline edit plumbing ─────────────────────────────────
  // Save a single custom field: read the current `customFields` bag from the
  // current leads list, patch one key, send the merged bag through the shared
  // updateLead mutation (which handles cache invalidation + realtime fan-out).
  const leadsRef = useRef(leads);
  leadsRef.current = leads;

  const handleCustomFieldSave = useCallback(
    async (leadId: string, fieldKey: string, value: string | null): Promise<void> => {
      const lead = leadsRef.current?.find((l) => l.id === leadId);
      const merged = { ...(lead?.customFields || {}), [fieldKey]: value };
      mutateLeadRef.current(
        { leadId, request: { customFields: merged } },
        {
          onError: () => toast.error(tRef.current('leads.update_failed')),
        },
      );
    },
    [],
  );

  const [editTarget, setEditTarget] = useState<{
    leadId: string;
    schema: CustomFieldSchema;
  } | null>(null);

  const handleOpenEditModal = useCallback(
    (leadId: string, schema: CustomFieldSchema) => {
      setEditTarget({ leadId, schema });
    },
    [],
  );

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
    onAssignChange: handleAssignChange,
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
    handleAssignChange,
    updateMutation.isPending,
  ]);

  const customCtx = useMemo<CustomFieldRenderContext>(
    () => ({
      t,
      locale: i18n.language,
      formatSmartTimestamp,
      onCustomFieldSave: handleCustomFieldSave,
      onOpenEditModal: handleOpenEditModal,
      isUpdating: updateMutation.isPending,
    }),
    [
      t,
      i18n.language,
      formatSmartTimestamp,
      handleCustomFieldSave,
      handleOpenEditModal,
      updateMutation.isPending,
    ],
  );

  const { columns, pinning, isLoading: isColumnsLoading } = useLeadTableColumns({
    ctx,
    customCtx,
    onViewConversation,
    onEditClick,
    onDeleteClick,
  });

  // ============================================================
  // Render
  // ============================================================

  if (isLoading || isColumnsLoading) {
    // Skeleton fills the available card height so the layout doesn't jump
    // when real data arrives.
    return (
      <div className="flex-1 min-h-0">
        <LeadsTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-h-0 bg-white rounded-lg border border-neutral-200 p-12 flex items-center justify-center">
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
      <div className="flex-1 min-h-0 bg-white rounded-lg border border-neutral-200 p-12 flex items-center justify-center">
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
    // Flex column that lets DataTableV2 (fillHeight=true) absorb the
    // remaining viewport height. min-h-0 is the load-bearing CSS — without
    // it the flex child refuses to shrink below its natural content size.
    <div className="flex flex-col flex-1 min-h-0">
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
        // Fixed-height table mode: header + filters stay static above; body
        // scrolls inside the card.
        fillHeight
        // Callback ref — populates `scrollContainer` state when the DOM
        // mounts, which re-runs `useInfiniteScroll` with the real root.
        scrollContainerRef={setScrollContainer}
        // Infinite-scroll status rendered as real <tr>s inside <tbody>, so
        // the horizontal scrollbar always sits below every row (real + loading).
        isFetchingNextPage={isFetchingNextPage}
        endOfListMessage={
          !hasMore && leads.length > 50
            ? t('leads.all_leads_loaded', { count: leads.length })
            : undefined
        }
      />

      {/* Custom-field edit modal — opened from the cell renderer for any
          free-text type (string / text / number / currency / email / url / phone).
          `key` forces a fresh component instance per (lead, field) so the
          modal's internal draft state can't bleed across openings. */}
      {editTarget && (() => {
        const lead = leads.find((l) => l.id === editTarget.leadId);
        const fieldKey = editTarget.schema.field_key;
        const currentValue = String(lead?.customFields?.[fieldKey] ?? '');
        return (
          <SchemaFieldEditModal
            key={`${editTarget.leadId}:${fieldKey}`}
            isOpen
            onClose={() => setEditTarget(null)}
            leadName={lead?.name ?? undefined}
            schema={editTarget.schema}
            currentValue={currentValue}
            isSaving={updateMutation.isPending}
            onSave={async (next) => {
              await handleCustomFieldSave(editTarget.leadId, fieldKey, next.length > 0 ? next : null);
              setEditTarget(null);
            }}
          />
        );
      })()}
    </div>
  );
}
