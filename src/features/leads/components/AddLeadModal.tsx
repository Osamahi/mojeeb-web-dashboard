/**
 * AddLeadModal Component
 * Modal for creating a new lead
 * Follows Knowledge Base modal pattern with validation
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useCreateLead, useLeadFieldDefinitions } from '../hooks/useLeads';
import type { LeadStatus, LeadFormErrors } from '../types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddLeadModal({ isOpen, onClose }: AddLeadModalProps) {
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
  const { data: fieldDefinitions } = useLeadFieldDefinitions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (createMutation.isPending) return;

    setErrors({});

    // Validate required fields
    const validationErrors: LeadFormErrors = {};

    if (!name.trim()) {
      validationErrors.name = 'Name is required';
    }

    // Validate custom required fields
    const customFieldErrors: Record<string, string> = {};
    fieldDefinitions?.forEach((field) => {
      const value = customFields[field.fieldKey];
      const isEmpty = value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
      if (field.isRequired && isEmpty) {
        customFieldErrors[field.fieldKey] = `${field.fieldLabel} is required`;
      }
    });

    if (Object.keys(customFieldErrors).length > 0) {
      validationErrors.customFields = customFieldErrors;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the validation errors');
      return;
    }

    if (!agentId) {
      toast.error('No agent selected');
      return;
    }

    // Create lead
    createMutation.mutate(
      {
        agentId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
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
      // Show feedback to user why close is blocked
      toast.info('Please wait while lead is being created...');
      return;
    }
    handleReset();
    onClose();
  };

  const handleCustomFieldChange = (fieldKey: string, value: string) => {
    setCustomFields((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
    // Clear error for this field
    if (errors.customFields?.[fieldKey]) {
      setErrors((prev) => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [fieldKey]: undefined,
        },
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Lead"
      description="Create a new lead for this agent"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-4 space-y-4">
          {/* Name (Required) */}
          <div>
          <Input
            label="Name *"
            placeholder="John Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            error={errors.name}
          />
        </div>

        {/* Phone */}
        <div>
          <Input
            label="Phone"
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {/* Custom Fields */}
        {fieldDefinitions && fieldDefinitions.length > 0 && (
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="text-sm font-medium text-neutral-900 mb-3">Custom Fields</h3>
            {fieldDefinitions.map((field) => (
              <div key={field.id} className="mb-3">
                {field.fieldType === 'textarea' ? (
                  <Textarea
                    label={`${field.fieldLabel}${field.isRequired ? ' *' : ''}`}
                    value={customFields[field.fieldKey] || ''}
                    onChange={(e) => handleCustomFieldChange(field.fieldKey, e.target.value)}
                    error={errors.customFields?.[field.fieldKey]}
                  />
                ) : field.fieldType === 'select' && field.options ? (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      {field.fieldLabel}{field.isRequired && ' *'}
                    </label>
                    <select
                      value={customFields[field.fieldKey] || ''}
                      onChange={(e) => handleCustomFieldChange(field.fieldKey, e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="">Select...</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.customFields?.[field.fieldKey] && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.customFields[field.fieldKey]}
                      </p>
                    )}
                  </div>
                ) : (
                  <Input
                    label={`${field.fieldLabel}${field.isRequired ? ' *' : ''}`}
                    type={field.fieldType === 'email' ? 'email' : field.fieldType === 'phone' ? 'tel' : field.fieldType === 'date' ? 'date' : 'text'}
                    value={customFields[field.fieldKey] || ''}
                    onChange={(e) => handleCustomFieldChange(field.fieldKey, e.target.value)}
                    error={errors.customFields?.[field.fieldKey]}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div>
          <Textarea
            label="Notes"
            placeholder="Additional information about this lead..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
        </div>

        {/* Actions Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-white rounded-b-2xl">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Create Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}
