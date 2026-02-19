/**
 * LeadEditMode Component
 * Schema-driven editable form for lead information
 * Renders system fields + custom fields from custom_field_schemas
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { SchemaFormField } from './SchemaFormField';
import { getSystemFormFieldValue } from '../utils/systemFieldHelpers';
import type { LeadStatus, LeadFormErrors } from '../types';
import type { CustomFieldSchema } from '../types/customFieldSchema.types';

interface LeadEditModeProps {
  name: string;
  phone: string;
  status: LeadStatus;
  notes: string;
  customFields: Record<string, any>;
  systemSchemas: CustomFieldSchema[];
  customSchemas: CustomFieldSchema[];
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
  systemSchemas,
  customSchemas,
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

  /**
   * Handle system field change — routes to the correct state setter
   */
  const handleSystemFieldChange = (fieldKey: string, value: string) => {
    switch (fieldKey) {
      case 'name':
        onNameChange(value);
        break;
      case 'phone':
        onPhoneChange(value);
        break;
      case 'status':
        onStatusChange(value as LeadStatus);
        break;
      case 'summary':
        onNotesChange(value);
        break;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* System fields in display_order */}
        {systemSchemas.map((schema) => (
          <div key={schema.id}>
            <SchemaFormField
              schema={schema}
              value={getSystemFormFieldValue(schema.field_key, { name, phone, status, notes })}
              onChange={(value) => handleSystemFieldChange(schema.field_key, value)}
              error={schema.field_key === 'name' ? errors.name : undefined}
            />
          </div>
        ))}

        {/* Custom fields */}
        {customSchemas.length > 0 && (
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="text-sm font-medium text-neutral-900 mb-3">{t('lead_details.custom_fields')}</h3>
            {customSchemas.map((schema) => (
              <div key={schema.id} className="mb-3">
                <SchemaFormField
                  schema={schema}
                  value={customFields[schema.field_key] || ''}
                  onChange={(value) => onCustomFieldChange(schema.field_key, value)}
                  error={errors.customFields?.[schema.field_key]}
                />
              </div>
            ))}
          </div>
        )}
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
