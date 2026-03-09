/**
 * Two-step modal for creating a new attachment
 * Step 1: Form (metadata) → Step 2: File upload
 */

import { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/ui/BaseModal';
import { useCreateAttachment, useUploadAttachmentFile, useUploadAlbumFiles } from '../hooks/useMutateAttachment';
import { useAgentContext } from '@/hooks/useAgentContext';
import { attachmentTypeOptions, FILE_LIMITS, validateFile, validateAlbumFiles } from '../utils/validation';
import type { CreateAttachmentRequest, AttachmentType } from '../types/attachment.types';

interface CreateAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AttachmentFormData = {
  name: string;
  description: string;
  triggerPrompt: string;
  attachmentType: AttachmentType;
  isActive: boolean;
  priority: number;
};

export function CreateAttachmentModal({ isOpen, onClose }: CreateAttachmentModalProps) {
  const { agentId } = useAgentContext();
  const createMutation = useCreateAttachment();
  const uploadFileMutation = useUploadAttachmentFile();
  const uploadAlbumMutation = useUploadAlbumFiles();

  const [step, setStep] = useState<1 | 2>(1);
  const [createdId, setCreatedId] = useState<string | null>(null);
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
    setCreatedType('photo');
    setUploadProgress(0);
    setFileError(null);
    onClose();
  }, [reset, onClose]);

  const onSubmitForm = async (data: AttachmentFormData) => {
    if (!agentId) return;

    const request: CreateAttachmentRequest = {
      agentId,
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
      setCreatedType(data.attachmentType);
      setStep(2);
    } catch {
      // Error already handled by mutation onError (toast)
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !createdId) return;

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
          file,
          onProgress: setUploadProgress,
        });
      }

      handleClose();
    } catch {
      // Error already handled by mutation onError (toast)
      // Reset file input so user can retry with same file
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
      title={step === 1 ? 'Create Attachment' : 'Upload Media'}
      subtitle={
        step === 1
          ? 'Configure a new attachment for your AI agent'
          : `Upload ${createdType === 'album' ? 'images (max 10)' : 'a file'} for this attachment`
      }
      maxWidth="lg"
      isLoading={createMutation.isPending || isUploading}
      closable={!createMutation.isPending && !isUploading}
    >
      {step === 1 ? (
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Name *
            </label>
            <input
              {...register('name', { required: 'Name is required' })}
              type="text"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Product Catalog"
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
              placeholder="Describe what this attachment contains..."
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
              placeholder="Describe when this attachment should be sent..."
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
              id="createIsActive"
              className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="createIsActive" className="text-sm text-neutral-700">
              Active (attachment can be sent by AI)
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating...' : 'Next: Upload Media'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
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
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
              Skip
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
