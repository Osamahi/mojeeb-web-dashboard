/**
 * Two-step modal for creating a new attachment
 * Step 1: Form (metadata with agent selector) → Step 2: File upload
 */

import { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { useCreateAttachment, useUploadAttachmentFile, useUploadAlbumFiles } from '../hooks/useMutateAttachment';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { attachmentTypeOptions, FILE_LIMITS, validateFile, validateAlbumFiles } from '../utils/validation';
import type { CreateAttachmentRequest, AttachmentType } from '../types/attachment.types';

interface CreateAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AttachmentFormData = {
  agentId: string;
  name: string;
  description: string;
  triggerPrompt: string;
  attachmentType: AttachmentType;
  isActive: boolean;
  priority: number;
};

export function CreateAttachmentModal({ isOpen, onClose }: CreateAttachmentModalProps) {
  const { t } = useTranslation();
  const agents = useAgentStore((state) => state.agents);
  const createMutation = useCreateAttachment();
  const uploadFileMutation = useUploadAttachmentFile();
  const uploadAlbumMutation = useUploadAlbumFiles();

  const [step, setStep] = useState<1 | 2>(1);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [createdType, setCreatedType] = useState<AttachmentType>('photo');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AttachmentFormData>({
    defaultValues: {
      agentId: '',
      name: '',
      description: '',
      triggerPrompt: '',
      attachmentType: 'photo',
      isActive: true,
      priority: 0,
    },
  });

  const handleClose = useCallback(() => {
    reset();
    setStep(1);
    setCreatedId(null);
    setCreatedAgentId(null);
    setCreatedType('photo');
    setUploadProgress(0);
    setFileError(null);
    onClose();
  }, [reset, onClose]);

  const onSubmitForm = async (data: AttachmentFormData) => {
    if (!data.agentId) return;

    const request: CreateAttachmentRequest = {
      agentId: data.agentId,
      name: data.name,
      description: data.description || undefined,
      triggerPrompt: data.triggerPrompt,
      attachmentType: data.attachmentType,
      isActive: data.isActive,
      priority: data.priority,
    };

    try {
      const result = await createMutation.mutateAsync(request);
      setCreatedId(result.id);
      setCreatedAgentId(data.agentId);
      setCreatedType(data.attachmentType);
      setStep(2);
    } catch {
      // Error already handled by mutation onError (toast)
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !createdId || !createdAgentId) return;

    setFileError(null);
    setUploadProgress(0);

    try {
      if (createdType === 'album') {
        const fileArray = Array.from(files);
        const error = validateAlbumFiles(fileArray);
        if (error) {
          setFileError(error);
          return;
        }

        await uploadAlbumMutation.mutateAsync({
          attachmentId: createdId,
          agentId: createdAgentId,
          files: fileArray,
          onProgress: setUploadProgress,
        });
      } else {
        const file = files[0];
        const error = validateFile(file, createdType);
        if (error) {
          setFileError(error);
          return;
        }

        await uploadFileMutation.mutateAsync({
          attachmentId: createdId,
          agentId: createdAgentId,
          file,
          onProgress: setUploadProgress,
        });
      }

      handleClose();
    } catch {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isUploading = uploadFileMutation.isPending || uploadAlbumMutation.isPending;
  const limits = FILE_LIMITS[createdType];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 1 ? t('attachments.create', 'Create Attachment') : t('attachments.upload_media', 'Upload Media')}
      subtitle={
        step === 1
          ? t('attachments.create_subtitle', 'Configure a new attachment for your AI agent')
          : `Upload ${createdType === 'album' ? 'images (max 10)' : 'a file'} for this attachment`
      }
      maxWidth="lg"
      isLoading={createMutation.isPending || isUploading}
      closable={!createMutation.isPending && !isUploading}
    >
      {step === 1 ? (
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Agent Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('attachments.field_agent', 'Agent')} *
            </label>
            <select
              {...register('agentId', { required: t('attachments.agent_required', 'Agent is required') })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb"
            >
              <option value="">{t('attachments.select_agent', 'Select an agent...')}</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            {errors.agentId && (
              <p className="text-xs text-red-600 mt-1">{errors.agentId.message}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('attachments.field_name', 'Name')} *
            </label>
            <input
              {...register('name', { required: t('attachments.name_required', 'Name is required') })}
              type="text"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb"
              placeholder={t('attachments.name_placeholder', 'e.g., Product Catalog')}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('attachments.field_description', 'Description')}
            </label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb resize-none"
              placeholder={t('attachments.description_placeholder', 'Describe what this attachment contains...')}
            />
          </div>

          {/* Attachment Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('attachments.field_type', 'Attachment Type')} *
            </label>
            <select
              {...register('attachmentType')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb"
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
              {t('attachments.field_trigger', 'Trigger Prompt')} *
            </label>
            <textarea
              {...register('triggerPrompt', {
                required: t('attachments.trigger_required', 'Trigger prompt is required'),
              })}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb resize-none"
              placeholder={t('attachments.trigger_placeholder', 'Describe when this attachment should be sent...')}
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
              {t('attachments.field_priority', 'Priority (0-1000)')}
            </label>
            <input
              {...register('priority', {
                valueAsNumber: true,
                min: { value: 0, message: t('attachments.priority_min', 'Priority must be at least 0') },
                max: { value: 1000, message: t('attachments.priority_max', 'Priority cannot exceed 1000') },
              })}
              type="number"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb"
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
              id="createIsActive"
              className="w-4 h-4 text-brand-mojeeb border-neutral-300 rounded focus:ring-brand-mojeeb/20"
            />
            <label htmlFor="createIsActive" className="text-sm text-neutral-700">
              {t('attachments.active_label', 'Active (attachment can be sent by AI)')}
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-brand-mojeeb text-white rounded-lg hover:bg-brand-mojeeb-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? t('attachments.creating', 'Creating...') : t('attachments.next_upload', 'Next: Upload Media')}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-brand-mojeeb hover:bg-brand-mojeeb-light transition-colors"
          >
            <div className="text-neutral-500 text-sm">
              <p className="font-medium mb-1">
                Click to select {createdType === 'album' ? 'images' : 'a file'}
              </p>
              <p className="text-xs text-neutral-400">
                Accepted: {limits.accept} | Max: {limits.maxSize / (1024 * 1024)}MB
                {createdType === 'album' ? ` | Up to ${limits.maxFiles} files` : ''}
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={limits.accept}
            multiple={createdType === 'album'}
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Upload Progress */}
          {isUploading && (
            <div>
              <div className="flex justify-between text-sm text-neutral-600 mb-1">
                <span>{t('attachments.uploading', 'Uploading...')}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-brand-mojeeb h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* File Error */}
          {fileError && (
            <p className="text-sm text-red-600">{fileError}</p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('attachments.skip', 'Skip')}
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
