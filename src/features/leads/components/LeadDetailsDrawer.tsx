/**
 * LeadDetailsDrawer Component
 * Shows lead details with edit and delete options
 * Uses modal pattern for consistency
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Edit2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useLead, useUpdateLead, useLeadFieldDefinitions } from '../hooks/useLeads';
import { LeadCommentsSection } from './LeadCommentsSection';
import ConversationViewDrawer from '@/features/conversations/components/ConversationViewDrawer';
import { formatPhoneNumber } from '../utils/formatting';
import type { LeadStatus, LeadFormErrors } from '../types';

interface LeadDetailsDrawerProps {
  leadId: string;
  onClose: () => void;
  initialEditMode?: boolean;
}

export default function LeadDetailsDrawer({ leadId, onClose, initialEditMode = false }: LeadDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [showConversationDrawer, setShowConversationDrawer] = useState(false);
  const [customFieldsExpanded, setCustomFieldsExpanded] = useState(false); // Default collapsed
  const [commentsExpanded, setCommentsExpanded] = useState(true); // Default expanded

  // Fetch lead data
  const { data: lead, isLoading } = useLead(leadId);
  const { data: fieldDefinitions } = useLeadFieldDefinitions();

  // Edit state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<LeadFormErrors>({});

  // Mutations
  const updateMutation = useUpdateLead();

  // Sync form state with lead data when entering edit mode or when lead changes during edit
  useEffect(() => {
    if (isEditing && lead) {
      setName(lead.name || '');
      setPhone(lead.phone || '');
      setStatus(lead.status);
      setNotes(lead.notes || '');
      setCustomFields(lead.customFields || {});
    }
  }, [isEditing, lead]);

  // Reset form when leadId changes (switching between leads)
  useEffect(() => {
    setIsEditing(initialEditMode);
    setErrors({});
  }, [leadId, initialEditMode]);

  // Initialize edit form
  const handleEdit = () => {
    if (!lead) return;
    setIsEditing(true);
    // Form will be populated by useEffect above
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    onClose();
  };

  // Handle close - cancel edit if editing, otherwise just close
  const handleClose = () => {
    if (isEditing) {
      handleCancelEdit();
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    // Prevent multiple submissions
    if (updateMutation.isPending) return;

    setErrors({});

    // Validate
    const validationErrors: LeadFormErrors = {};

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

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={handleClose} title="Lead Details">
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      </Modal>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <>
      <Modal
        isOpen={true}
        onClose={handleClose}
        title={isEditing ? 'Edit Lead' : 'Lead Details'}
        size="md"
      >
        {isEditing ? (
          /* Edit Mode */
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
            <div>
              <Input
                label="Name"
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

            <div>
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
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

            {/* Custom Fields - Collapsible in Edit Mode */}
            {fieldDefinitions && fieldDefinitions.length > 0 && (
              <div className="border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setCustomFieldsExpanded(!customFieldsExpanded)}
                  className="w-full flex items-center justify-between mb-3 hover:bg-neutral-50 -mx-2 px-2 py-1 rounded transition-colors"
                >
                  <h3 className="text-sm font-medium text-neutral-900">Custom Fields</h3>
                  {customFieldsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
                {customFieldsExpanded && (
                  <div className="space-y-3">
                    {fieldDefinitions.map((field) => (
                      <div key={field.id}>
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
                              {field.fieldLabel}
                              {field.isRequired && ' *'}
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
                            type={
                              field.fieldType === 'email'
                                ? 'email'
                                : field.fieldType === 'phone'
                                ? 'tel'
                                : field.fieldType === 'date'
                                ? 'date'
                                : 'text'
                            }
                            value={customFields[field.fieldKey] || ''}
                            onChange={(e) => handleCustomFieldChange(field.fieldKey, e.target.value)}
                            error={errors.customFields?.[field.fieldKey]}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <Textarea
                label="Summary"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-white flex-shrink-0 rounded-b-2xl">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </>
        ) : (
          /* View Mode */
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">Name</label>
              {lead.name ? (
                <p className="text-base text-neutral-900">{lead.name}</p>
              ) : (
                <button
                  onClick={handleEdit}
                  className="text-base text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  Add Name
                </button>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">Phone</label>
              {lead.phone ? (
                <p className="text-base text-neutral-900">{formatPhoneNumber(lead.phone)}</p>
              ) : (
                <button
                  onClick={handleEdit}
                  className="text-base text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  Add Mobile
                </button>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">Status</label>
              <p className="text-base text-neutral-900 capitalize">{lead.status}</p>
            </div>

            {/* Created */}
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">Created</label>
              <p className="text-xs text-neutral-400">{(() => {
                try {
                  const date = new Date(lead.createdAt);
                  return !isNaN(date.getTime()) ? date.toLocaleString() : 'Invalid date';
                } catch {
                  return 'Invalid date';
                }
              })()}</p>
            </div>

            {/* Updated */}
            {(() => {
              try {
                const created = new Date(lead.createdAt).getTime();
                const updated = new Date(lead.updatedAt).getTime();
                if (!isNaN(updated) && updated > created) {
                  return (
                    <div>
                      <label className="block text-sm font-medium text-neutral-500 mb-1">Updated</label>
                      <p className="text-xs text-neutral-400">{new Date(lead.updatedAt).toLocaleString()}</p>
                    </div>
                  );
                }
                return null;
              } catch {
                return null;
              }
            })()}

            {/* Custom Fields - Collapsible */}
            {lead.customFields && Object.keys(lead.customFields).length > 0 && (
              <div className="border-t border-neutral-200 pt-4">
                <button
                  onClick={() => setCustomFieldsExpanded(!customFieldsExpanded)}
                  className="w-full flex items-center justify-between mb-3 hover:bg-neutral-50 -mx-2 px-2 py-1 rounded transition-colors"
                >
                  <h3 className="text-sm font-medium text-neutral-900">Custom Fields</h3>
                  {customFieldsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
                {customFieldsExpanded && (
                  <div className="space-y-2">
                    {Object.entries(lead.customFields).map(([key, value]) => {
                      const fieldDef = fieldDefinitions?.find((f) => f.fieldKey === key);
                      return (
                        <div key={key}>
                          <label className="block text-sm font-medium text-neutral-500 mb-1">
                            {fieldDef?.fieldLabel || key}
                          </label>
                          <p className="text-base text-neutral-900">{String(value) || '—'}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            {lead.notes && (
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Summary</label>
                <p className="text-base text-neutral-900 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}

            {/* Conversation Link */}
            {lead.conversationId && (
              <div className="bg-neutral-50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm text-neutral-700">Linked to conversation</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleViewConversation}>
                  View
                </Button>
              </div>
            )}

            {/* Comments Section - Collapsible */}
            <div className="border-t border-neutral-200 pt-4 mt-4">
              <button
                onClick={() => setCommentsExpanded(!commentsExpanded)}
                className="w-full flex items-center justify-between mb-3 hover:bg-neutral-50 -mx-2 px-2 py-1 rounded transition-colors"
              >
                <h3 className="text-sm font-medium text-neutral-900">Comments</h3>
                {commentsExpanded ? (
                  <ChevronUp className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                )}
              </button>
              {commentsExpanded && (
                <LeadCommentsSection leadId={lead.id} />
              )}
            </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-white flex-shrink-0 rounded-b-2xl">
              <Button variant="secondary" onClick={handleEdit} icon={Edit2}>
                Edit
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Conversation View Drawer */}
      <ConversationViewDrawer
        conversationId={lead?.conversationId || null}
        isOpen={showConversationDrawer}
        onClose={() => setShowConversationDrawer(false)}
      />
    </>
  );
}
