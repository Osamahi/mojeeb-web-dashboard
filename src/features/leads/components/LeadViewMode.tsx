/**
 * LeadViewMode Component
 * Schema-driven read-only display of lead information
 * Renders system fields + custom fields from custom_field_schemas
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SchemaFormField } from './SchemaFormField';
import { LeadNotesSection } from './LeadNotesSection';
import { useDateLocale } from '@/lib/dateConfig';
import { getSystemFieldValue } from '../utils/systemFieldHelpers';
import type { Lead } from '../types';
import type { CustomFieldSchema } from '../types/customFieldSchema.types';

interface LeadViewModeProps {
  lead: Lead;
  systemSchemas: CustomFieldSchema[];
  customSchemas: CustomFieldSchema[];
  onEdit: () => void;
  onViewConversation: () => void;
}

export function LeadViewMode({
  lead,
  systemSchemas,
  customSchemas,
  onEdit,
  onViewConversation,
}: LeadViewModeProps) {
  const { t } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();
  const [notesExpanded, setNotesExpanded] = useState(true);

  return (
    <>
      <div className="space-y-4">
        {/* System fields in display_order (read-only via SchemaFormField) */}
        {systemSchemas.map((schema) => {
          // Skip notes in the system fields — notes have their own section below
          if (schema.field_key === 'notes') return null;

          return (
            <div key={schema.id}>
              <SchemaFormField
                schema={schema}
                value={getSystemFieldValue(lead, schema.field_key)}
                onChange={() => {}}
                readOnly
              />
            </div>
          );
        })}

        {/* Updated At (show if different from created) */}
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

        {/* Custom fields (read-only) */}
        {customSchemas.length > 0 && (
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="text-sm font-medium text-neutral-900 mb-3">{t('lead_details.custom_fields')}</h3>
            {customSchemas.map((schema) => {
              const value = lead.customFields?.[schema.field_key];
              // Skip empty custom fields in view mode
              if (value === null || value === undefined || value === '') return null;
              return (
                <div key={schema.id} className="mb-3">
                  <SchemaFormField
                    schema={schema}
                    value={value}
                    onChange={() => {}}
                    readOnly
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Conversation Link */}
        {lead.conversationId && (
          <div className="bg-neutral-50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-neutral-600" />
              <span className="text-sm text-neutral-700">{t('lead_details.linked_conversation')}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onViewConversation}>
              {t('lead_details.view_conversation')}
            </Button>
          </div>
        )}

        {/* Notes Section - Collapsible */}
        <div className="border-t border-neutral-200 pt-4 mt-4">
          <button
            onClick={() => setNotesExpanded(!notesExpanded)}
            className="w-full flex items-center justify-between mb-3 hover:bg-neutral-50 -mx-2 px-2 py-1 rounded transition-colors"
          >
            <h3 className="text-sm font-medium text-neutral-900">{t('lead_details.notes')}</h3>
            {notesExpanded ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </button>
          {notesExpanded && <LeadNotesSection leadId={lead.id} agentId={lead.agentId} />}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-white flex-shrink-0 rounded-b-2xl">
        <Button variant="secondary" onClick={onEdit} icon={Edit2}>
          {t('lead_details.edit_button')}
        </Button>
      </div>
    </>
  );
}
