/**
 * LeadInlineDetails
 *
 * The shared body of any lead-detail surface (conversation side-drawer or
 * Leads-page modal). Renders:
 *   - schema-driven system fields in display_order
 *   - inline status dropdown (Clients-page style)
 *   - custom fields
 *   - the notes section
 *
 * UX shape (intentionally identical wherever it's mounted):
 *   - Click anywhere on a field row → enter edit mode (input auto-focuses)
 *   - Click outside / Tab away → commit (no change → no save)
 *   - Enter → commit (except in multi-line `text` fields where Enter is a newline)
 *   - Escape → cancel; stops bubbling so the host drawer/modal doesn't also close
 *   - ✓ saves, ✗ cancels (visible while editing)
 *   - While saving, the cell's value swaps to a shimmer skeleton; everything
 *     else on the page stays fully interactive
 *
 * Callers wire up the optimistic update via `useInlineLeadEdit`.
 */

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { SchemaFormField } from './SchemaFormField';
import { LeadNotesSection } from './LeadNotesSection';
import { LeadStatusDropdown } from './LeadStatusDropdown';
import { useDateLocale } from '@/lib/dateConfig';
import { getSystemFieldValue } from '../utils/systemFieldHelpers';
import type { Lead, LeadStatus, UpdateLeadRequest } from '../types';
import type { CustomFieldSchema } from '../types/customFieldSchema.types';

/**
 * Field types whose value can never be user-edited — created_at / updated_at
 * use `timestamp`. SchemaFormField also disables datetime-style inputs for it.
 */
const READ_ONLY_FIELD_TYPES = new Set(['timestamp']);

export interface LeadInlineDetailsProps {
  lead: Lead;
  /**
   * All form-visible schemas (system + custom) for this agent, in their
   * desired render order. Callers should pass an already-merged + sorted
   * list — the component does not re-split by `is_system`. Fields render as
   * a single continuous list so the system/custom distinction is invisible
   * to the user.
   */
  schemas: CustomFieldSchema[];
  /** Field-key of the cell currently being saved (or null). Drives cell-level skeleton. */
  savingFieldKey: string | null;
  /** Save a system field (status, name, phone, summary) with its field key. */
  onSaveField: (patch: UpdateLeadRequest, fieldKey: string) => void;
  /** Save a custom field by merging into the customFields JSONB bag. */
  onSaveCustomField: (fieldKey: string, value: string) => void;
}

export function LeadInlineDetails({
  lead,
  schemas,
  savingFieldKey,
  onSaveField,
  onSaveCustomField,
}: LeadInlineDetailsProps) {
  const { t } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();

  // Map a system schema field_key to the UpdateLeadRequest patch that saves it.
  const systemFieldPatch = (fieldKey: string, value: string): UpdateLeadRequest | null => {
    switch (fieldKey) {
      case 'name':
        return { name: value.trim() || undefined };
      case 'phone':
        return { phone: value.trim() || undefined };
      case 'summary':
        return { summary: value.trim() || undefined };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* One continuous list — system + custom interleaved by display_order.
          Status renders inline so its schema position controls placement. */}
      {schemas.map((schema) => {
        if (schema.field_key === 'notes') return null;

        if (schema.is_system && schema.field_key === 'status') {
          return (
            <InlineStatusField
              key={schema.id}
              currentStatus={lead.status}
              isSaving={savingFieldKey === 'status'}
              onChange={(next) => onSaveField({ status: next }, 'status')}
            />
          );
        }

        if (schema.is_system) {
          const patchBuilder = (value: string) => {
            const patch = systemFieldPatch(schema.field_key, value);
            if (patch) onSaveField(patch, schema.field_key);
          };
          return (
            <InlineEditableField
              key={schema.id}
              schema={schema}
              value={getSystemFieldValue(lead, schema.field_key)}
              isSaving={savingFieldKey === schema.field_key}
              onSave={patchBuilder}
            />
          );
        }

        return (
          <InlineEditableField
            key={schema.id}
            schema={schema}
            value={lead.customFields?.[schema.field_key]}
            isSaving={savingFieldKey === `cf:${schema.field_key}`}
            onSave={(value) => onSaveCustomField(schema.field_key, value)}
          />
        );
      })}

      {/* Updated-at — read-only meta, only shown when distinct from created. */}
      {(() => {
        try {
          const created = new Date(lead.createdAt).getTime();
          const updated = new Date(lead.updatedAt).getTime();
          if (!isNaN(updated) && updated > created) {
            return (
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">
                  {t('lead_details.updated_label')}
                </label>
                <p className="text-xs text-neutral-400">{formatSmartTimestamp(lead.updatedAt)}</p>
              </div>
            );
          }
          return null;
        } catch {
          return null;
        }
      })()}

      {/* Notes */}
      <div className="border-t border-neutral-200 pt-4">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">
          {t('lead_details.notes')}
        </h3>
        <LeadNotesSection leadId={lead.id} agentId={lead.agentId} />
      </div>
    </div>
  );
}

// ============================================================================
// Inline status field — thin label wrapper around the shared LeadStatusDropdown
// ============================================================================

function InlineStatusField({
  currentStatus,
  isSaving,
  onChange,
}: {
  currentStatus: string;
  isSaving: boolean;
  onChange: (next: LeadStatus) => void;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-500 mb-1">
        {t('leads.status')}
      </label>
      {isSaving ? (
        // Match the other cells' skeleton shape exactly so the save UX is
        // visually consistent across every field.
        <Skeleton height="20px" width="60%" />
      ) : (
        <LeadStatusDropdown status={currentStatus} onChange={onChange} />
      )}
    </div>
  );
}

// ============================================================================
// Inline editable schema-driven field
// ============================================================================

function InlineEditableField({
  schema,
  value,
  isSaving,
  onSave,
}: {
  schema: CustomFieldSchema;
  value: unknown;
  isSaving: boolean;
  onSave: (value: string) => void;
}) {
  const { i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const previousValueRef = useRef<string>('');

  const isReadOnly = READ_ONLY_FIELD_TYPES.has(schema.field_type);
  const localizedLabel = i18n.language.startsWith('ar') ? schema.name_ar : schema.name_en;
  const fieldLabel = schema.is_required ? `${localizedLabel} *` : localizedLabel;

  const startEdit = () => {
    if (isReadOnly) return;
    const seed = value == null ? '' : String(value);
    setDraft(seed);
    previousValueRef.current = seed;
    setIsEditing(true);
  };

  const commit = () => {
    if (draft !== previousValueRef.current) onSave(draft);
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(previousValueRef.current);
    setIsEditing(false);
    // Blur the active input before React swaps to read-mode. Otherwise the
    // browser's focus-restoration lands on the read-mode row (which is a
    // role="button"), and its :focus-visible ring paints a stray blue outline.
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      // The host drawer/modal listens for Escape on `window`, which React's
      // stopPropagation doesn't reach — use the native event to block it so
      // Escape discards the edit instead of also closing the host.
      e.nativeEvent.stopImmediatePropagation();
      cancel();
    } else if (e.key === 'Enter' && schema.field_type !== 'text') {
      e.preventDefault();
      commit();
    }
  };

  // Commit on blur — but only when focus truly left the editor. Native controls
  // (<select> dropdowns, date pickers) momentarily move focus within our
  // wrapper; checking relatedTarget avoids a premature commit there.
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    commit();
  };

  if (isEditing) {
    return (
      <div onKeyDown={handleKeyDown} onBlur={handleBlur} tabIndex={-1} className="space-y-2">
        <SchemaFormField schema={schema} value={draft} onChange={setDraft} />
        {/* ✓/✗ mirror the keyboard shortcuts; onMouseDown.preventDefault stops
            the editor's own blur from firing before the button's click. */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={cancel}
            aria-label="Cancel"
            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={commit}
            aria-label="Save"
            className="inline-flex items-center gap-1 px-2 py-1.5 bg-neutral-900 text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role={isReadOnly || isSaving ? undefined : 'button'}
      tabIndex={isReadOnly || isSaving ? undefined : 0}
      aria-label={isReadOnly ? undefined : 'Edit'}
      aria-busy={isSaving || undefined}
      onClick={isReadOnly || isSaving ? undefined : startEdit}
      onKeyDown={
        isReadOnly || isSaving
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startEdit();
              }
            }
      }
      className={cn(
        'group flex items-start justify-between gap-3 -mx-2 px-2 py-1 rounded transition-colors',
        !isReadOnly && !isSaving && 'cursor-pointer hover:bg-neutral-50'
      )}
    >
      <div className="flex-1 min-w-0 pointer-events-none">
        {isSaving ? (
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-1">
              {fieldLabel}
            </label>
            <Skeleton height="20px" width="60%" />
          </div>
        ) : (
          <SchemaFormField schema={schema} value={value} onChange={() => {}} readOnly />
        )}
      </div>
      {!isReadOnly && !isSaving && (
        <Pencil className="w-3.5 h-3.5 mt-7 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}
