/**
 * Single-step modal for creating a new attachment with drag & drop file upload.
 * Auto-detects attachment type from files (photo / album / video / document).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Upload, X, Image, Film, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaseModal } from '@/components/ui/BaseModal';
import { useCreateAttachment, useUploadAttachmentFile, useUploadAlbumFiles } from '../hooks/useMutateAttachment';
import { FILE_LIMITS, validateFile, validateAlbumFiles } from '../utils/validation';
import type { AttachmentType } from '../types/attachment.types';

interface CreateAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

type FormData = {
  name: string;
  triggerPrompt: string;
};

/** Detect attachment type from selected files */
function detectAttachmentType(files: File[]): AttachmentType | null {
  if (files.length === 0) return null;

  const hasImages = files.some((f) => f.type.startsWith('image/'));
  const hasVideos = files.some((f) => f.type.startsWith('video/'));
  const hasDocs = files.some(
    (f) =>
      f.type === 'application/pdf' ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );

  // Check for mixed types
  const typeCount = [hasImages, hasVideos, hasDocs].filter(Boolean).length;
  if (typeCount > 1) return null; // mixed → error

  if (hasImages) return files.length === 1 ? 'photo' : 'album';
  if (hasVideos) return 'video';
  if (hasDocs) return 'document';

  return null;
}

/** Format file size for display */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** All accepted MIME types for the file input */
const ALL_ACCEPTED = '.jpg,.jpeg,.png,.webp,.mp4,.mov,.pdf,.docx';

/** Stable key for a File object */
function fileKey(file: File, index: number): string {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

export function CreateAttachmentModal({ isOpen, onClose, agentId }: CreateAttachmentModalProps) {
  const { t } = useTranslation();
  const createMutation = useCreateAttachment();
  const uploadFileMutation = useUploadAttachmentFile();
  const uploadAlbumMutation = useUploadAlbumFiles();

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: { name: '', triggerPrompt: '' },
  });

  // Preview URLs keyed by "filename-size" for images
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  // Revoke all preview URLs on unmount or modal close
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(() => {
    // Revoke all preview URLs
    Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls({});
    reset();
    setFiles([]);
    setIsDragging(false);
    setUploadProgress(0);
    setFileError(null);
    dragCountRef.current = 0;
    onClose();
  }, [reset, onClose, previewUrls]);

  // Validate and add files
  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setFileError(null);
      const fileArray = Array.from(newFiles);

      // Merge with existing
      const merged = [...files, ...fileArray];

      // Detect type
      const detectedType = detectAttachmentType(merged);
      if (detectedType === null && merged.length > 0) {
        setFileError(t('attachments.mixed_types_error', 'Please upload files of the same type'));
        return;
      }

      // Validate each file
      if (detectedType) {
        if (detectedType === 'album') {
          const error = validateAlbumFiles(merged);
          if (error) {
            setFileError(error);
            return;
          }
        } else {
          // Single file types — only allow 1
          if (merged.length > 1) {
            setFileError(
              t('attachments.single_file_only', 'Only one file allowed for this type. Remove the existing file first.')
            );
            return;
          }
          const error = validateFile(merged[0], detectedType);
          if (error) {
            setFileError(error);
            return;
          }
        }
      }

      // Create preview URLs for new image files eagerly
      const newUrls: Record<string, string> = {};
      merged.forEach((f, i) => {
        const key = fileKey(f, i);
        if (f.type.startsWith('image/') && !previewUrls[key]) {
          newUrls[key] = URL.createObjectURL(f);
        }
      });
      if (Object.keys(newUrls).length > 0) {
        setPreviewUrls((prev) => ({ ...prev, ...newUrls }));
      }

      setFiles(merged);
    },
    [files, t, previewUrls]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Rebuild preview URLs with correct indices
      const newUrls: Record<string, string> = {};
      updated.forEach((f, i) => {
        const key = fileKey(f, i);
        // Try to find existing URL from old indices
        for (const [oldKey, url] of Object.entries(previewUrls)) {
          if (oldKey.startsWith(`${f.name}-${f.size}-${f.lastModified}-`)) {
            newUrls[key] = url;
            break;
          }
        }
      });
      // Revoke URLs no longer needed
      for (const [oldKey, url] of Object.entries(previewUrls)) {
        if (!Object.values(newUrls).includes(url)) {
          URL.revokeObjectURL(url);
        }
      }
      setPreviewUrls(newUrls);
      return updated;
    });
    setFileError(null);
  }, [previewUrls]);

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current -= 1;
    if (dragCountRef.current <= 0) {
      setIsDragging(false);
      dragCountRef.current = 0;
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCountRef.current = 0;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
      }
    },
    [addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addFiles]
  );

  // Submit: create attachment → upload files
  const onSubmit = async (data: FormData) => {
    if (files.length === 0) {
      setFileError(t('attachments.files_required', 'Please add at least one file'));
      return;
    }

    const attachmentType = detectAttachmentType(files);
    if (!attachmentType) {
      setFileError(t('attachments.mixed_types_error', 'Please upload files of the same type'));
      return;
    }

    try {
      // Step 1: Create attachment metadata
      const result = await createMutation.mutateAsync({
        agentId,
        name: data.name,
        triggerPrompt: data.triggerPrompt,
        attachmentType,
        isActive: true,
        priority: 0,
      });

      // Step 2: Upload file(s)
      setUploadProgress(0);
      if (attachmentType === 'album') {
        await uploadAlbumMutation.mutateAsync({
          attachmentId: result.id,
          agentId,
          files,
          onProgress: setUploadProgress,
        });
      } else {
        await uploadFileMutation.mutateAsync({
          attachmentId: result.id,
          agentId,
          file: files[0],
          onProgress: setUploadProgress,
        });
      }

      handleClose();
    } catch {
      // Errors handled by mutation onError (toast)
    }
  };

  const isSubmitting = createMutation.isPending || uploadFileMutation.isPending || uploadAlbumMutation.isPending;

  // Get image preview URL by file index
  const getImagePreviewUrl = (fileIndex: number): string | undefined => {
    const file = files[fileIndex];
    if (!file || !file.type.startsWith('image/')) return undefined;
    return previewUrls[fileKey(file, fileIndex)];
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('attachments.create', 'Create Attachment')}
      subtitle={t('attachments.create_subtitle', 'Add media that your AI agent can send to customers')}
      maxWidth="lg"
      isLoading={isSubmitting}
      closable={!isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('attachments.field_name', 'Name')} *
          </label>
          <input
            {...register('name', { required: t('attachments.name_required', 'Name is required') })}
            type="text"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb transition-colors"
            placeholder={t('attachments.name_placeholder', 'e.g., Product Catalog')}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Instructions (Trigger Prompt) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('attachments.instructions_label', 'Instructions')} *
          </label>
          <textarea
            {...register('triggerPrompt', {
              required: t('attachments.trigger_required', 'Instructions are required'),
            })}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb resize-none transition-colors"
            placeholder={t('attachments.instructions_helper', 'Give AI clear instructions about this attachment and when to use it')}
            disabled={isSubmitting}
          />
          {errors.triggerPrompt && (
            <p className="text-xs text-red-600 mt-1">{errors.triggerPrompt.message}</p>
          )}
        </div>

        {/* Drop Zone */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('attachments.field_files', 'Files')} *
          </label>
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
              isDragging
                ? 'border-brand-mojeeb bg-brand-mojeeb/5'
                : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/50'
            )}
          >
            <Upload className={cn('w-8 h-8 mx-auto mb-2', isDragging ? 'text-brand-mojeeb' : 'text-neutral-400')} />
            <p className={cn('text-sm font-medium', isDragging ? 'text-brand-mojeeb' : 'text-neutral-500')}>
              {isDragging
                ? t('attachments.drop_zone_active', 'Drop files here')
                : t('attachments.drop_zone_text', 'Drag files here or click to browse')}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Images, videos, or documents
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ALL_ACCEPTED}
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* File Error */}
        {fileError && (
          <p className="text-sm text-red-600">{fileError}</p>
        )}

        {/* File Previews */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, idx) => {
              const isImage = file.type.startsWith('image/');
              const isVideo = file.type.startsWith('video/');
              const previewUrl = isImage ? getImagePreviewUrl(idx) : undefined;

              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="relative flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg p-2 pe-8 max-w-[220px]"
                >
                  {/* Thumbnail or icon */}
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="w-12 h-12 rounded-md object-cover bg-white border border-neutral-200 flex-shrink-0"
                    />
                  ) : isVideo ? (
                    <div className="relative w-12 h-12 rounded-md bg-white border border-neutral-200 flex-shrink-0 overflow-hidden">
                      <video
                        src={URL.createObjectURL(file)}
                        muted
                        preload="metadata"
                        className="w-full h-full object-cover"
                        onLoadedMetadata={(e) => {
                          const video = e.currentTarget;
                          video.currentTime = 0.1;
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-neutral-400" />
                    </div>
                  )}

                  {/* File info */}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-700 truncate">{file.name}</p>
                    <p className="text-[10px] text-neutral-400">{formatFileSize(file.size)}</p>
                  </div>

                  {/* Remove button */}
                  {!isSubmitting && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-neutral-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Progress */}
        {(uploadFileMutation.isPending || uploadAlbumMutation.isPending) && (
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

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || files.length === 0}
            className="px-4 py-2 bg-brand-mojeeb text-white rounded-lg hover:bg-brand-mojeeb-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? t('attachments.creating_uploading', 'Uploading...')
              : t('attachments.create_button', 'Create Attachment')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
