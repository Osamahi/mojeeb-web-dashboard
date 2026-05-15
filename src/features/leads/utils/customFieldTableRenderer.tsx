/**
 * Custom Field Table Renderer
 *
 * Routes each custom-field cell to the right editor:
 *
 *   Modal-edited (free-text):
 *     string / text / number / currency / email / url / phone
 *       → opens CustomFieldEditModal (single input or textarea, save button)
 *
 *   Inline pickers:
 *     enum  → EnumDropdown (color badge + popover)
 *     boolean → click toggles true/false
 *     date / datetime → native date picker via InlineEditField
 *
 *   Read-only:
 *     timestamp → display only
 *
 * Empty cells show "Add" (or "Select" for enum) so users discover the
 * affordance — same pattern as the summary system column.
 */

import type { ReactNode } from 'react';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { InlineEditField } from '@/components/ui/InlineEditField';
import { EnumDropdown } from '../components/EnumDropdown';
import type { CustomFieldSchema, FieldType } from '../types/customFieldSchema.types';
import type { Lead } from '../types/lead.types';

/**
 * Render context — supplies the per-row save handlers and i18n state.
 */
export interface CustomFieldRenderContext {
  /** Translate function. */
  t: (key: string, options?: Record<string, unknown>) => string;
  /** Active locale ('en' | 'ar'). */
  locale: string;
  /** Smart timestamp formatter (reused from useDateLocale). */
  formatSmartTimestamp: (date: string, options?: { showTimezone?: boolean; useRelative?: boolean }) => string;
  /** Save a single custom field by merging into customFields. */
  onCustomFieldSave: (leadId: string, fieldKey: string, value: string | null) => Promise<void>;
  /** Open the edit modal for a free-text custom field. */
  onOpenEditModal: (leadId: string, schema: CustomFieldSchema) => void;
  /** Mutation pending state — disables the editors while a save is in flight. */
  isUpdating: boolean;
}

/**
 * Render a custom-field cell for a given lead + schema.
 */
export const renderCustomFieldCell = (
  lead: Lead,
  schema: CustomFieldSchema,
  ctx: CustomFieldRenderContext,
): ReactNode => {
  const raw = lead.customFields?.[schema.field_key];

  switch (schema.field_type) {
    case 'enum': {
      const stringValue = raw === null || raw === undefined ? '' : String(raw);
      return (
        <EnumDropdown
          schema={schema}
          value={stringValue}
          onChange={(next) =>
            void ctx.onCustomFieldSave(lead.id, schema.field_key, next.length > 0 ? next : null)
          }
          disabled={ctx.isUpdating}
        />
      );
    }

    case 'boolean':
      return (
        <BooleanCell
          value={raw}
          onSave={(next) => ctx.onCustomFieldSave(lead.id, schema.field_key, next)}
          t={ctx.t}
          isUpdating={ctx.isUpdating}
        />
      );

    case 'date':
    case 'datetime': {
      const stringValue = raw === null || raw === undefined ? '' : String(raw);
      return (
        <InlineEditField
          value={stringValue}
          onSave={(next) =>
            ctx.onCustomFieldSave(lead.id, schema.field_key, next.length > 0 ? next : null)
          }
          inputType={schema.field_type === 'date' ? 'date' : 'datetime-local'}
          isLoading={ctx.isUpdating}
          renderValue={(v) => (
            <span className="text-sm text-neutral-900">
              {safeFormat(v, ctx.formatSmartTimestamp)}
            </span>
          )}
        />
      );
    }

    case 'timestamp': {
      // Read-only — no inline edit, no "Add" affordance.
      const stringValue = raw === null || raw === undefined ? '' : String(raw);
      if (!stringValue) return null;
      return (
        <span className="text-sm text-neutral-900">
          {safeFormat(stringValue, ctx.formatSmartTimestamp)}
        </span>
      );
    }

    // Free-text types (string / text / number / currency / email / url / phone)
    // all open the same modal so the editing UX matches notes/summary.
    default: {
      const stringValue = raw === null || raw === undefined ? '' : String(raw);
      return <FreeTextCell lead={lead} schema={schema} value={stringValue} ctx={ctx} />;
    }
  }
};

/**
 * Cell for any free-text field — opens CustomFieldEditModal on click.
 * Display formatting per type (link / phone / currency / truncated text).
 */
function FreeTextCell({
  lead,
  schema,
  value,
  ctx,
}: {
  lead: Lead;
  schema: CustomFieldSchema;
  value: string;
  ctx: CustomFieldRenderContext;
}) {
  const isEmpty = !value || value.trim() === '';

  const open = (e: React.MouseEvent) => {
    e.stopPropagation();
    ctx.onOpenEditModal(lead.id, schema);
  };

  return (
    <button
      type="button"
      onClick={open}
      className="ltr:text-left rtl:text-right w-full hover:bg-neutral-50 rounded transition-colors px-2 py-1 -mx-2 -my-1 min-w-0"
    >
      {isEmpty ? (
        <span className="text-sm text-neutral-400">{ctx.t('common.add')}</span>
      ) : (
        <FreeTextDisplay value={value} fieldType={schema.field_type} />
      )}
    </button>
  );
}

function FreeTextDisplay({ value, fieldType }: { value: string; fieldType: FieldType }) {
  switch (fieldType) {
    case 'phone':
      return (
        <span className="text-sm text-neutral-900">
          <PhoneNumber value={value} />
        </span>
      );

    case 'email':
    case 'url':
      // Plain text — not a link. Clicking the cell opens the edit modal.
      // A dedicated mailto/open-link affordance can be layered on later.
      return (
        <span
          className="text-sm text-neutral-900 truncate block"
          title={value}
        >
          {value}
        </span>
      );

    case 'currency': {
      const n = parseFloat(value);
      return (
        <span className="text-sm text-neutral-900 font-medium">
          {Number.isFinite(n)
            ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : value}
        </span>
      );
    }

    case 'text': {
      const maxLength = 100;
      const truncated = value.length > maxLength;
      const display = truncated ? `${value.substring(0, maxLength)}...` : value;
      return (
        <span
          className="text-sm text-neutral-700 line-clamp-2 break-words"
          title={truncated ? value : undefined}
        >
          {display}
        </span>
      );
    }

    default:
      return <span className="text-sm text-neutral-900">{value}</span>;
  }
}

/**
 * Boolean cell — click toggles. Empty state shows "Add" and a first click
 * sets it to true; filled state shows the boolean as words ("Yes" / "No")
 * so it stays visually distinct from the unset/empty state.
 */
function BooleanCell({
  value,
  onSave,
  t,
  isUpdating,
}: {
  value: unknown;
  onSave: (next: string) => Promise<void>;
  t: (key: string, options?: Record<string, unknown>) => string;
  isUpdating: boolean;
}) {
  const isEmpty = value === null || value === undefined || value === '';
  const boolValue = value === true || value === 'true';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating) return;
    if (isEmpty) {
      void onSave('true');
    } else {
      void onSave(boolValue ? 'false' : 'true');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isUpdating}
      className="inline-flex items-center px-2 py-1 -mx-2 -my-1 rounded hover:bg-neutral-50 transition-colors disabled:opacity-50"
    >
      {isEmpty ? (
        <span className="text-sm text-neutral-400">{t('common.add')}</span>
      ) : (
        <span className={`text-sm font-medium ${boolValue ? 'text-green-600' : 'text-neutral-500'}`}>
          {boolValue ? t('common.yes') : t('common.no')}
        </span>
      )}
    </button>
  );
}

function safeFormat(
  raw: string,
  formatSmartTimestamp: (date: string) => string,
): string {
  try {
    return formatSmartTimestamp(raw);
  } catch {
    return raw;
  }
}

/**
 * Get optimal column width based on field type.
 */
export const getColumnWidth = (fieldType: FieldType): string => {
  switch (fieldType) {
    case 'boolean':
      return '80px';

    case 'date':
    case 'datetime':
      return '160px';

    case 'currency':
    case 'number':
      return '120px';

    case 'email':
    case 'url':
      return '200px';

    case 'text':
      return '250px';

    case 'string':
    case 'phone':
    case 'timestamp':
    case 'enum':
    default:
      return '160px';
  }
};
