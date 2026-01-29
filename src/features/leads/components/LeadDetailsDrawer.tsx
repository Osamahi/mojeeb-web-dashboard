/**
 * LeadDetailsDrawer Component
 * Coordinator for lead details display and editing
 * Refactored to use separated view and edit mode components
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Spinner } from '@/components/ui/Spinner';
import { useLead, useUpdateLead, useLeadFieldDefinitions } from '../hooks/useLeads';
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
  const { data: fieldDefinitions } = useLeadFieldDefinitions();

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

    // Validate custom required fields
    const validationErrors: LeadFormErrors = {};
    const customFieldErrors: Record<string, string> = {};

    fieldDefinitions?.forEach((field) => {
      const value = customFields[field.fieldKey];
      const isEmpty =
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '');

      if (field.isRequired && isEmpty) {
        customFieldErrors[field.fieldKey] = t('lead_details.field_required', {
          field: field.fieldLabel,
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
          name: name.trim(),
          phone: phone.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
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
            fieldDefinitions={fieldDefinitions}
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
            fieldDefinitions={fieldDefinitions}
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
