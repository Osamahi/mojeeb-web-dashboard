/**
 * Modal for uploading media to an existing attachment
 */

import { useState, useRef } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { useUploadAttachmentFile, useUploadAlbumFiles } from '../hooks/useMutateAttachment';
import { FILE_LIMITS, validateFile, validateAlbumFiles } from '../utils/validation';
import type { Attachment } from '../types/attachment.types';
import { hasMedia } from '../utils/formatting';

interface UploadMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: Attachment | null;
}

export function UploadMediaModal({ isOpen, onClose, attachment }: UploadMediaModalProps) {
  const uploadFileMutation = useUploadAttachmentFile();
  const uploadAlbumMutation = useUploadAlbumFiles();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadFileMutation.isPending || uploadAlbumMutation.isPending;
  const type = attachment?.attachmentType || 'photo';
  const limits = FILE_LIMITS[type];
  const alreadyHasMedia = attachment ? hasMedia(attachment.mediaConfig) : false;

  const handleClose = () => {
    setUploadProgress(0);
    setFileError(null);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !attachment) return;

    setFileError(null);
    setUploadProgress(0);

    try {
      if (type === 'album') {
        const fileArray = Array.from(files);
        const error = validateAlbumFiles(fileArray);
        if (error) {
          setFileError(error);
          return;
        }

        await uploadAlbumMutation.mutateAsync({
          attachmentId: attachment.id,
          files: fileArray,
          onProgress: setUploadProgress,
        });
      } else {
        const file = files[0];
        const error = validateFile(file, type);
        if (error) {
          setFileError(error);
          return;
        }

        await uploadFileMutation.mutateAsync({
          attachmentId: attachment.id,
          file,
          onProgress: setUploadProgress,
        });
      }

      handleClose();
    } catch {
      // Error already handled by mutation onError (toast)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Media"
      subtitle={attachment?.name || ''}
      maxWidth="md"
      isLoading={isUploading}
      closable={!isUploading}
    >
      <div className="space-y-4">
        {alreadyHasMedia && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            This attachment already has media. Uploading will replace the existing file(s).
          </div>
        )}

        {/* File Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
        >
          <div className="text-neutral-500 text-sm">
            <p className="font-medium mb-1">
              Click to select {type === 'album' ? 'images' : 'a file'}
            </p>
            <p className="text-xs text-neutral-400">
              Accepted: {limits?.accept} | Max: {limits ? limits.maxSize / (1024 * 1024) : 0}MB
              {type === 'album' ? ` | Up to ${limits?.maxFiles} files` : ''}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={limits?.accept}
          multiple={type === 'album'}
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
            Cancel
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
