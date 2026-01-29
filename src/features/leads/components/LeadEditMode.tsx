/**
 * LeadEditMode Component
 * Provides editable form for lead information
 * Part of the LeadDetailsDrawer refactoring
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { CustomFieldsSection } from './CustomFieldsSection';
import type { LeadStatus, LeadFormErrors, LeadFieldDefinition } from '../types';

interface LeadEditModeProps {
  name: string;
  phone: string;
  status: LeadStatus;
  notes: string;
  customFields: Record<string, any>;
  fieldDefinitions?: LeadFieldDefinition[];
  errors: LeadFormErrors;
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onStatusChange: (value: LeadStatus) => void;
  onNotesChange: (value: string) => void;
  onCustomFieldChange: (fieldKey: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function LeadEditMode({
  name,
  phone,
  status,
  notes,
  customFields,
  fieldDefinitions,
  errors,
  isLoading,
  onNameChange,
  onPhoneChange,
  onStatusChange,
  onNotesChange,
  onCustomFieldChange,
  onSave,
  onCancel,
}: LeadEditModeProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-4">
        {/* Name */}
        <div>
          <Input
            label={t('lead_details.name_label')}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            error={errors.name}
          />
        </div>

        {/* Phone */}
        <div>
          <Input
            label={t('lead_details.phone_label')}
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('lead_details.status_label')}
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as LeadStatus)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          >
            <option value="new">{t('lead_details.status_new')}</option>
            <option value="processing">{t('lead_details.status_processing')}</option>
            <option value="completed">{t('lead_details.status_completed')}</option>
          </select>
        </div>

        {/* Custom Fields */}
        <CustomFieldsSection
          customFields={customFields}
          fieldDefinitions={fieldDefinitions}
          readOnly={false}
          onFieldChange={onCustomFieldChange}
          errors={errors.customFields}
          initiallyExpanded={false}
        />

        {/* Summary / Notes */}
        <div>
          <Textarea
            label={t('lead_details.summary_label')}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-white flex-shrink-0 rounded-b-2xl">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {t('lead_details.cancel_button')}
        </Button>
        <Button onClick={onSave} isLoading={isLoading}>
          {t('lead_details.save_button')}
        </Button>
      </div>
    </>
  );
}
