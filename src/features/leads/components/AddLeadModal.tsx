/**
 * AddLeadModal Component
 * Modal for creating a new lead
 * Schema-driven rendering from custom_field_schemas
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { SchemaFormField } from './SchemaFormField';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useCreateLead } from '../hooks/useLeads';
import { useFormCustomFieldSchemas } from '../hooks/useCustomFieldSchemas';
import { getSystemFormFieldValue } from '../utils/systemFieldHelpers';
import type { LeadStatus, LeadFormErrors } from '../types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddLeadModal({ isOpen, onClose }: AddLeadModalProps) {
  const { t, i18n } = useTranslation();
  const { agentId } = useAgentContext();

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<LeadFormErrors>({});

  // Hooks
  const createMutation = useCreateLead();
  const { data: formSchemas = [] } = useFormCustomFieldSchemas();

  // Split schemas into system and custom
  const { systemSchemas, customSchemas } = useMemo(() => ({
    systemSchemas: formSchemas.filter(s => s.is_system).sort((a, b) => a.display_order - b.display_order),
    customSchemas: formSchemas.filter(s => !s.is_system).sort((a, b) => a.display_order - b.display_order),
  }), [formSchemas]);

  /**
   * Handle system field change — routes to the correct state setter
   */
  const handleSystemFieldChange = (fieldKey: string, value: string) => {
    switch (fieldKey) {
      case 'name':
        setName(value);
        if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
        break;
      case 'phone':
        setPhone(value);
        break;
      case 'status':
        setStatus(value as LeadStatus);
        break;
      case 'summary':
        setNotes(value);
        break;
    }
  };

  const handleCustomFieldChange = (fieldKey: string, value: string) => {
    setCustomFields((prev) => ({ ...prev, [fieldKey]: value }));
    if (errors.customFields?.[fieldKey]) {
      setErrors((prev) => ({
        ...prev,
        customFields: { ...prev.customFields, [fieldKey]: undefined },
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createMutation.isPending) return;

    setErrors({});
    const validationErrors: LeadFormErrors = {};

    // Validate name (always required)
    if (!name.trim()) {
      validationErrors.name = t('leads.name_required');
    }

    // Validate required custom fields from schemas
    const customFieldErrors: Record<string, string> = {};
    customSchemas.forEach((schema) => {
      const value = customFields[schema.field_key];
      const isEmpty = value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
      if (schema.is_required && isEmpty) {
        const fieldLabel = i18n.language.startsWith('ar') ? schema.name_ar : schema.name_en;
        customFieldErrors[schema.field_key] = t('leads.field_required', { field: fieldLabel });
      }
    });

    if (Object.keys(customFieldErrors).length > 0) {
      validationErrors.customFields = customFieldErrors;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(t('leads.validation_error'));
      return;
    }

    if (!agentId) {
      toast.error(t('leads.no_agent_selected'));
      return;
    }

    createMutation.mutate(
      {
        agentId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        status,
        summary: notes.trim() || undefined,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
      },
      {
        onSuccess: () => {
          handleReset();
          onClose();
        },
      }
    );
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setStatus('new');
    setNotes('');
    setCustomFields({});
    setErrors({});
  };

  const handleClose = () => {
    if (createMutation.isPending) {
      toast.info(t('leads.creating_lead'));
      return;
    }
    handleReset();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('leads.add_client_modal_title')}
      subtitle={t('leads.add_client_modal_subtitle')}
      maxWidth="md"
      isLoading={createMutation.isPending}
      closable={!createMutation.isPending}
    >
      <form onSubmit={handleSubmit}>
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
              <h3 className="text-sm font-medium text-neutral-900 mb-3">{t('leads.custom_fields_title')}</h3>
              {customSchemas.map((schema) => (
                <div key={schema.id} className="mb-3">
                  <SchemaFormField
                    schema={schema}
                    value={customFields[schema.field_key] || ''}
                    onChange={(value) => handleCustomFieldChange(schema.field_key, value)}
                    error={errors.customFields?.[schema.field_key]}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-white rounded-b-2xl">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            {t('leads.create_lead_button')}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
