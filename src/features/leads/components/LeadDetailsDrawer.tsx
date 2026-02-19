/**
 * LeadDetailsDrawer Component
 * Coordinator for lead details display and editing
 * Schema-driven — uses custom_field_schemas as single source of truth
 */

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Spinner } from '@/components/ui/Spinner';
import { useLead, useUpdateLead } from '../hooks/useLeads';
import { useFormCustomFieldSchemas } from '../hooks/useCustomFieldSchemas';
import { LeadViewMode } from './LeadViewMode';
import { LeadEditMode } from './LeadEditMode';
import ConversationViewDrawer from '@/features/conversations/components/ConversationViewDrawer';
import type { LeadStatus, LeadFormErrors } from '../types';

interface LeadDetailsDrawerProps {
  leadId: string;
  onClose: () => void;
  initialEditMode?: boolean;
}

export default function LeadDetailsDrawer({
  leadId,
  onClose,
  initialEditMode = false,
}: LeadDetailsDrawerProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [showConversationDrawer, setShowConversationDrawer] = useState(false);

  // Fetch data
  const { data: lead, isLoading } = useLead(leadId);

  // Schema-driven field definitions
  const { data: formSchemas = [] } = useFormCustomFieldSchemas();

  // Split schemas into system and custom
  const { systemSchemas, customSchemas } = useMemo(() => ({
    systemSchemas: formSchemas.filter(s => s.is_system).sort((a, b) => a.display_order - b.display_order),
    customSchemas: formSchemas.filter(s => !s.is_system).sort((a, b) => a.display_order - b.display_order),
  }), [formSchemas]);

  // Edit form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<LeadFormErrors>({});

  // Mutations
  const updateMutation = useUpdateLead();

  // Sync form state with lead data when entering edit mode
  useEffect(() => {
    if (isEditing && lead) {
      setName(lead.name || '');
      setPhone(lead.phone || '');
      setStatus(lead.status);
      setNotes(lead.summary || '');
      setCustomFields(lead.customFields || {});
    }
  }, [isEditing, lead]);

  // Reset form when leadId changes
  useEffect(() => {
    setIsEditing(initialEditMode);
    setErrors({});
  }, [leadId, initialEditMode]);

  // Handlers
  const handleEdit = () => {
    if (!lead) return;
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    if (isEditing) {
      handleCancelEdit();
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (updateMutation.isPending) return;

    setErrors({});

    // Validate required custom fields from schemas
    const validationErrors: LeadFormErrors = {};
    const customFieldErrors: Record<string, string> = {};

    customSchemas.forEach((schema) => {
      const value = customFields[schema.field_key];
      const isEmpty =
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '');

      if (schema.is_required && isEmpty) {
        customFieldErrors[schema.field_key] = t('lead_details.field_required', {
          field: schema.name_en,
        });
      }
    });

    if (Object.keys(customFieldErrors).length > 0) {
      validationErrors.customFields = customFieldErrors;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(t('lead_details.validation_errors'));
      return;
    }

    // Update lead
    updateMutation.mutate(
      {
        leadId,
        request: {
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          status,
          summary: notes.trim() || undefined,
          customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          onClose();
        },
      }
    );
  };

  const handleCustomFieldChange = (fieldKey: string, value: string) => {
    setCustomFields((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
    // Clear validation error for this field when user corrects input
    if (errors.customFields?.[fieldKey]) {
      setErrors((prev) => {
        const updatedCustomFields = { ...prev.customFields };
        delete updatedCustomFields[fieldKey];
        return {
          ...prev,
          customFields: Object.keys(updatedCustomFields).length > 0 ? updatedCustomFields : undefined,
        };
      });
    }
  };

  const handleViewConversation = () => {
    if (!lead?.conversationId) return;
    setShowConversationDrawer(true);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <BaseModal
        isOpen={true}
        onClose={handleClose}
        title={t('lead_details.title')}
        maxWidth="md"
        isLoading={true}
      >
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      </BaseModal>
    );
  }

  // No lead found
  if (!lead) {
    return null;
  }

  return (
    <>
      <BaseModal
        isOpen={true}
        onClose={handleClose}
        title={isEditing ? t('lead_details.edit_title') : t('lead_details.title')}
        maxWidth="md"
        isLoading={updateMutation.isPending}
        closable={!updateMutation.isPending}
      >
        {isEditing ? (
          <LeadEditMode
            name={name}
            phone={phone}
            status={status}
            notes={notes}
            customFields={customFields}
            systemSchemas={systemSchemas}
            customSchemas={customSchemas}
            errors={errors}
            isLoading={updateMutation.isPending}
            onNameChange={handleNameChange}
            onPhoneChange={setPhone}
            onStatusChange={setStatus}
            onNotesChange={setNotes}
            onCustomFieldChange={handleCustomFieldChange}
            onSave={handleSave}
            onCancel={handleCancelEdit}
          />
        ) : (
          <LeadViewMode
            lead={lead}
            systemSchemas={systemSchemas}
            customSchemas={customSchemas}
            onEdit={handleEdit}
            onViewConversation={handleViewConversation}
          />
        )}
      </BaseModal>

      {/* Conversation View Drawer */}
      <ConversationViewDrawer
        conversationId={lead?.conversationId || null}
        isOpen={showConversationDrawer}
        onClose={() => setShowConversationDrawer(false)}
      />
    </>
  );
}
