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
  onStatusChange: (leadId: string, newStatus: LeadStatus, e: React.ChangeEvent<HTMLSelectElement>) => void;

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
    <div className="py-1 max-w-sm min-w-0">
      {lead.summary ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            ctx.onAddSummaryClick(lead.id, lead.name || '', lead.summary || '');
          }}
          className="ltr:text-left rtl:text-right w-full group hover:text-neutral-900 transition-colors min-w-0"
        >
          <div className="text-sm text-neutral-700 leading-relaxed break-words whitespace-normal">
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
 * Render: Status column (dropdown select with inline update)
 */
const renderStatusColumn = (
  _value: unknown,
  lead: Lead,
  ctx: SystemFieldRenderContext,
  schema?: CustomFieldSchema,
): ReactNode => {
  return (
    <select
      value={lead.status}
      onChange={(e) => ctx.onStatusChange(lead.id, e.target.value as LeadStatus, e)}
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
      {schema?.options?.length ? (
        // Schema-driven options with i18n labels
        schema.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {ctx.locale === 'ar' ? opt.label_ar : opt.label_en}
          </option>
        ))
      ) : (
        // Fallback to translation keys
        <>
          <option value="new">{ctx.t('leads.status_new')}</option>
          <option value="processing">{ctx.t('leads.status_processing')}</option>
          <option value="completed">{ctx.t('leads.status_completed')}</option>
        </>
      )}
    </select>
  );
};

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
 * Get column width for system fields
 */
export const getSystemFieldColumnWidth = (fieldKey: string): string => {
  switch (fieldKey) {
    case 'name':
      return '25%';
    case 'summary':
      return '30%';
    case 'status':
      return '180px';
    case 'notes':
      return '18%';
    case 'created_at':
      return '14%';
    default:
      return '150px';
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
