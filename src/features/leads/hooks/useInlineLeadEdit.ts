/**
 * useInlineLeadEdit
 *
 * Encapsulates the inline per-field save flow for a lead detail view:
 *   - optimistic update of the per-lead React Query cache
 *   - tracking which field is mid-save (so the UI can show a cell-level
 *     skeleton on only that cell rather than locking the whole drawer)
 *   - rollback on error, reconcile on success
 *
 * The shared `useUpdateLead` hook relies on the Supabase realtime
 * subscription to refresh caches, but that subscription only updates the
 * table-list cache (`queryKeys.leads`), not the per-lead cache
 * (`queryKeys.lead(leadId)`) that detail views read. Without the optimistic
 * patch here, the user would have to refresh to see their edit.
 *
 * Field-key conventions for `savingFieldKey`:
 *   - system fields: raw field_key ("name", "phone", "summary", "status")
 *   - custom fields: "cf:<field_key>"
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateLead } from './useLeads';
import { useLead } from './useLeads';
import { queryKeys } from '@/lib/queryKeys';
import type { Lead, UpdateLeadRequest } from '../types';

export interface UseInlineLeadEdit {
  /** Field key currently mid-save, or null. See module doc for key format. */
  savingFieldKey: string | null;
  /** Save a partial lead patch and track it under the given field key. */
  saveField: (patch: UpdateLeadRequest, fieldKey: string) => void;
  /** Convenience: save a single custom field by merging into customFields. */
  saveCustomField: (fieldKey: string, value: string) => void;
}

export function useInlineLeadEdit(leadId: string | undefined): UseInlineLeadEdit {
  const queryClient = useQueryClient();
  const { data: lead } = useLead(leadId);
  const updateMutation = useUpdateLead();
  const [savingFieldKey, setSavingFieldKey] = useState<string | null>(null);

  const saveField = (patch: UpdateLeadRequest, fieldKey: string) => {
    // No-op while the drawer is closing/closed and no lead is loaded.
    if (!lead || !leadId) return;

    const previous = queryClient.getQueryData<Lead>(queryKeys.lead(leadId));
    const optimistic: Lead = {
      ...lead,
      ...(patch.name !== undefined && { name: patch.name ?? '' }),
      ...(patch.phone !== undefined && { phone: patch.phone ?? null }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.summary !== undefined && { summary: patch.summary ?? null }),
      ...(patch.customFields !== undefined && { customFields: patch.customFields }),
      updatedAt: new Date().toISOString(),
    };
    queryClient.setQueryData(queryKeys.lead(leadId), optimistic);
    setSavingFieldKey(fieldKey);

    updateMutation.mutate(
      { leadId, request: patch },
      {
        onError: () => {
          if (previous) queryClient.setQueryData(queryKeys.lead(leadId), previous);
        },
        onSuccess: (serverLead) => {
          queryClient.setQueryData(queryKeys.lead(leadId), serverLead);
        },
        onSettled: () => {
          setSavingFieldKey(null);
        },
      }
    );
  };

  const saveCustomField = (fieldKey: string, value: string) => {
    if (!lead || !leadId) return;
    const merged = { ...(lead.customFields || {}), [fieldKey]: value };
    saveField({ customFields: merged }, `cf:${fieldKey}`);
  };

  return { savingFieldKey, saveField, saveCustomField };
}
