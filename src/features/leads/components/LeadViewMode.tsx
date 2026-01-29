/**
 * LeadViewMode Component
 * Displays lead information in read-only mode
 * Part of the LeadDetailsDrawer refactoring
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { CustomFieldsSection } from './CustomFieldsSection';
import { LeadNotesSection } from './LeadNotesSection';
import type { Lead, LeadFieldDefinition } from '../types';

interface LeadViewModeProps {
  lead: Lead;
  fieldDefinitions?: LeadFieldDefinition[];
  onEdit: () => void;
  onViewConversation: () => void;
}

export function LeadViewMode({
  lead,
  fieldDefinitions,
  onEdit,
  onViewConversation,
}: LeadViewModeProps) {
  const { t } = useTranslation();
  const [notesExpanded, setNotesExpanded] = useState(true);

  return (
    <>
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            {t('lead_details.name_label')}
          </label>
          {lead.name ? (
            <p className="text-base text-neutral-900">{lead.name}</p>
          ) : (
            <button
              onClick={onEdit}
              className="text-base text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {t('lead_details.add_name')}
            </button>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            {t('lead_details.phone_label')}
          </label>
          {lead.phone ? (
            <PhoneNumber value={lead.phone} className="text-base text-neutral-900" />
          ) : (
            <button
              onClick={onEdit}
              className="text-base text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {t('lead_details.add_phone')}
            </button>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            {t('lead_details.status_label')}
          </label>
          <p className="text-base text-neutral-900 capitalize">{lead.status}</p>
        </div>

        {/* Created */}
        <div>
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            {t('lead_details.created_label')}
          </label>
          <p className="text-xs text-neutral-400">
            {(() => {
              try {
                const date = new Date(lead.createdAt);
                return !isNaN(date.getTime())
                  ? date.toLocaleString()
                  : t('lead_details.invalid_date');
              } catch {
                return t('lead_details.invalid_date');
              }
            })()}
          </p>
        </div>

        {/* Updated */}
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
                  <p className="text-xs text-neutral-400">{new Date(lead.updatedAt).toLocaleString()}</p>
                </div>
              );
            }
            return null;
          } catch {
            return null;
          }
        })()}

        {/* Custom Fields */}
        <CustomFieldsSection
          customFields={lead.customFields || {}}
          fieldDefinitions={fieldDefinitions}
          readOnly={true}
          initiallyExpanded={false}
        />

        {/* Summary */}
        {lead.summary && (
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-1">
              {t('lead_details.summary_label')}
            </label>
            <p className="text-base text-neutral-900 whitespace-pre-wrap">{lead.summary}</p>
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
          {notesExpanded && <LeadNotesSection leadId={lead.id} />}
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
