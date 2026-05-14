/**
 * System Field Renderers for Table
 *
 * Maps system field_key → specialized table cell render functions
 * Extracted from LeadsTableView's hardcoded column renderers
 *
 * Architecture:
 * - Each renderer is a factory that returns a (value, lead) => ReactNode
 * - Handlers (save, status change, etc.) are passed in via context
 * - Pure rendering logic — no hooks, no side effects
 */

import type { ReactNode } from 'react';
import { Copy } from 'lucide-react';
import { InlineEditField } from '@/components/ui/InlineEditField';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { LatestNoteCell } from '../components/LatestNoteCell';
import { LeadStatusDropdown } from '../components/LeadStatusDropdown';
import { validateName, validatePhone } from './validation';
import { formatPhoneNumber } from './formatting';
import type { Lead, LeadStatus } from '../types/lead.types';
import type { CustomFieldSchema } from '../types/customFieldSchema.types';

/**
 * Context passed to system field renderers
 * Contains all callbacks and state needed for interactive cells
 */
export interface SystemFieldRenderContext {
  // Translation function
  t: (key: string) => string;

  // i18n locale ('en' | 'ar')
  locale: string;

  // Smart timestamp formatter
  formatSmartTimestamp: (date: string, options?: { showTimezone?: boolean; useRelative?: boolean }) => string;

  // Name inline edit
  onNameSave: (leadId: string, newName: string) => Promise<void>;

  // Phone inline edit
  onPhoneSave: (leadId: string, newPhone: string) => Promise<void>;

  // Copy phone to clipboard
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;

  // Summary click
  onAddSummaryClick: (leadId: string, name: string, summary: string) => void;

  // Status change
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;

  // Notes click
  onAddNoteClick: (leadId: string, name: string, agentId: string) => void;

  // Update mutation loading state
  isUpdating: boolean;
}

/**
 * Render: Name column (with inline edit + phone subtitle)
 */
const renderNameColumn = (
  _value: unknown,
  lead: Lead,
  ctx: SystemFieldRenderContext,
): ReactNode => {
  return (
    <div className="flex flex-col gap-1.5 py-1">
      <InlineEditField
        value={lead.name}
        fieldName="Name"
        placeholder={ctx.t('leads.enter_lead_name_placeholder')}
        onSave={(newName) => ctx.onNameSave(lead.id, newName)}
        validationFn={validateName}
        isLoading={ctx.isUpdating}
        // Match the Notes column typography so the row reads as one block.
        displayClassName="text-[13px] text-neutral-900"
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
              onClick={(e) => ctx.onCopyPhone(lead.phone!, e)}
              className="p-1 hover:bg-neutral-100 rounded transition-all order-1"
              title={ctx.t('leads.copy_phone_title')}
            >
              <Copy className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700" />
            </button>
          </>
        ) : (
          <div className="order-0">
            <InlineEditField
              value={lead.phone}
              fieldName="Phone"
              placeholder={ctx.t('leads.enter_phone_placeholder')}
              onSave={(newPhone) => ctx.onPhoneSave(lead.id, newPhone)}
              validationFn={validatePhone}
              isPhone={true}
              isLoading={ctx.isUpdating}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Render: Summary column (clickable text, max 120 chars)
 */
const renderSummaryColumn = (
  _value: unknown,
  lead: Lead,
  ctx: SystemFieldRenderContext,
): ReactNode => {
  const maxLength = 120;
  const shouldTruncate = lead.summary && lead.summary.length > maxLength;
  const displayText = shouldTruncate ? lead.summary!.substring(0, maxLength) : lead.summary;

  return (
    <div className="py-1 max-w-xs min-w-0">
      {lead.summary ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            ctx.onAddSummaryClick(lead.id, lead.name || '', lead.summary || '');
          }}
          className="ltr:text-left rtl:text-right w-full group hover:text-neutral-900 transition-colors min-w-0"
        >
          <div className="text-[13px] text-neutral-900 leading-relaxed break-words whitespace-normal">
            {displayText}
            {shouldTruncate && <span className="text-neutral-400 group-hover:text-neutral-900"> ...{ctx.t('leads.view_more')}</span>}
          </div>
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            ctx.onAddSummaryClick(lead.id, lead.name || '', '');
          }}
          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors ltr:text-left rtl:text-right w-full"
        >
          {ctx.t('leads.add_summary')}
        </button>
      )}
    </div>
  );
};

/**
 * Render: Status column.
 *
 * Delegates to `LeadStatusDropdown` so the status picker UX (popup style,
 * color dot, check icon, RTL behavior) stays identical across the table
 * card, table column, and detail drawer. The `schema` arg is intentionally
 * unused here — `LeadStatusDropdown` resolves options via
 * `useLeadStatusSchema` internally, which is the same source of truth.
 */
const renderStatusColumn = (
  _value: unknown,
  lead: Lead,
  ctx: SystemFieldRenderContext,
  _schema?: CustomFieldSchema,
): ReactNode => (
  <LeadStatusDropdown
    status={lead.status}
    onChange={(next) => ctx.onStatusChange(lead.id, next)}
  />
);

/**
 * Render: Notes column (LatestNoteCell with preview)
 */
const renderNotesColumn = (
  _value: unknown,
  lead: Lead,
  ctx: SystemFieldRenderContext,
): ReactNode => {
  return <LatestNoteCell lead={lead} onAddNoteClick={ctx.onAddNoteClick} />;
};

/**
 * Render: Created At column (formatSmartTimestamp)
 */
const renderCreatedAtColumn = (
  _value: unknown,
  lead: Lead,
  ctx: SystemFieldRenderContext,
): ReactNode => {
  try {
    return (
      <span className="text-[13px] text-neutral-900">
        {ctx.formatSmartTimestamp(lead.createdAt)}
      </span>
    );
  } catch {
    return <span className="text-neutral-700">—</span>;
  }
};

/**
 * Get the system field renderer for a given field key
 * Returns null if the field_key is not a recognized system field
 */
export const getSystemFieldRenderer = (
  fieldKey: string,
  ctx: SystemFieldRenderContext,
  schema?: CustomFieldSchema,
): ((value: unknown, lead: Lead) => ReactNode) | null => {
  switch (fieldKey) {
    case 'name':
      return (value, lead) => renderNameColumn(value, lead, ctx);
    case 'summary':
      return (value, lead) => renderSummaryColumn(value, lead, ctx);
    case 'status':
      return (value, lead) => renderStatusColumn(value, lead, ctx, schema);
    case 'notes':
      return (value, lead) => renderNotesColumn(value, lead, ctx);
    case 'created_at':
      return (value, lead) => renderCreatedAtColumn(value, lead, ctx);
    default:
      return null;
  }
};

/**
 * Get column width for system fields.
 *
 * Fixed px widths for sized columns + `'auto'` for the Summary column.
 *
 * `tableLayout: auto` distributes any extra container width across columns
 * whose width is `auto` (or empty). By giving Summary `'auto'`, it absorbs
 * the slack on wide viewports — so the sticky-end actions cell hugs the
 * page's right edge instead of leaving a gap before it. On narrow viewports
 * Summary collapses toward its min content width, and the table starts to
 * scroll horizontally (via `min-w-max` on the <table> element).
 *
 * Returning an empty string lets DataTable skip the `style.width` entirely,
 * which is the cleanest way to say "let the browser decide."
 */
export const getSystemFieldColumnWidth = (fieldKey: string): string => {
  switch (fieldKey) {
    case 'name':
      return '240px';
    case 'summary':
      return ''; // auto — absorbs slack
    case 'status':
      return '160px';
    case 'notes':
      return '200px';
    case 'created_at':
      return '160px';
    default:
      return '160px';
  }
};

/**
 * Get sortable setting for system fields
 */
export const isSystemFieldSortable = (fieldKey: string): boolean => {
  switch (fieldKey) {
    case 'name':
    case 'status':
    case 'created_at':
      return true;
    default:
      return false;
  }
};
