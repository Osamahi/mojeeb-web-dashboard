/**
 * Modal for editing an existing attachment
 * Pre-populates form with current values
 */

import { useForm } from 'react-hook-form';
import { useEffect, useCallback } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { useUpdateAttachment } from '../hooks/useMutateAttachment';
import { attachmentTypeOptions } from '../utils/validation';
import type { Attachment, UpdateAttachmentRequest, AttachmentType } from '../types/attachment.types';

interface EditAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: Attachment | null;
}

type AttachmentFormData = {
  name: string;
  description: string;
  triggerPrompt: string;
  attachmentType: AttachmentType;
  isActive: boolean;
  priority: number;
};

export function EditAttachmentModal({
  isOpen,
  onClose,
  attachment,
}: EditAttachmentModalProps) {
  const updateMutation = useUpdateAttachment();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AttachmentFormData>();

  // Pre-populate form when attachment changes
  useEffect(() => {
    if (attachment) {
      reset({
        name: attachment.name,
        description: attachment.description || '',
        triggerPrompt: attachment.triggerPrompt,
        attachmentType: attachment.attachmentType,
        isActive: attachment.isActive,
        priority: attachment.priority,
      });
    }
  }, [attachment, reset]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const onSubmit = async (data: AttachmentFormData) => {
    if (!attachment) return;

    const request: UpdateAttachmentRequest = {
      name: data.name,
      description: data.description,
      triggerPrompt: data.triggerPrompt,
      attachmentType: data.attachmentType,
      isActive: data.isActive,
      priority: data.priority,
    };

    try {
      await updateMutation.mutateAsync({
        attachmentId: attachment.id,
        request,
      });
      handleClose();
    } catch {
      // Error already handled by mutation onError (toast)
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Attachment"
      subtitle={attachment?.name || ''}
      maxWidth="lg"
      isLoading={updateMutation.isPending}
      closable={!updateMutation.isPending}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Name *
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            type="text"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={2}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Attachment Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Attachment Type *
          </label>
          <select
            {...register('attachmentType')}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {attachmentTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Prompt */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Trigger Prompt *
          </label>
          <textarea
            {...register('triggerPrompt', {
              required: 'Trigger prompt is required',
            })}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {errors.triggerPrompt && (
            <p className="text-xs text-red-600 mt-1">
              {errors.triggerPrompt.message}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Priority (0-1000)
          </label>
          <input
            {...register('priority', {
              valueAsNumber: true,
              min: { value: 0, message: 'Priority must be at least 0' },
              max: { value: 1000, message: 'Priority cannot exceed 1000' },
            })}
            type="number"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.priority && (
            <p className="text-xs text-red-600 mt-1">
              {errors.priority.message}
            </p>
          )}
        </div>

        {/* Is Active Checkbox */}
        <div className="flex items-center gap-2">
          <input
            {...register('isActive')}
            type="checkbox"
            id="editIsActive"
            className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="editIsActive" className="text-sm text-neutral-700">
            Active (attachment can be sent by AI)
          </label>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={updateMutation.isPending}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
