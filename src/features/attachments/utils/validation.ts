/**
 * Validation utilities for attachment forms and file uploads
 */

import type { AttachmentType } from '../types/attachment.types';

/**
 * Attachment type options for select inputs
 */
export const attachmentTypeOptions: { label: string; value: AttachmentType }[] = [
  { label: 'Photo', value: 'photo' },
  { label: 'Album', value: 'album' },
  { label: 'Video', value: 'video' },
  { label: 'Document', value: 'document' },
];

/**
 * File limits per attachment type
 */
export const FILE_LIMITS: Record<
  AttachmentType,
  { maxSize: number; maxFiles: number; accept: string; mimeTypes: string[] }
> = {
  photo: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    accept: '.jpg,.jpeg,.png,.webp',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  album: {
    maxSize: 10 * 1024 * 1024, // 10MB each
    maxFiles: 10,
    accept: '.jpg,.jpeg,.png,.webp',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  video: {
    maxSize: 16 * 1024 * 1024, // 16MB
    maxFiles: 1,
    accept: '.mp4,.mov',
    mimeTypes: ['video/mp4', 'video/quicktime'],
  },
  document: {
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 1,
    accept: '.pdf,.docx',
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
};

/**
 * Validate a single file against attachment type limits
 */
export function validateFile(
  file: File,
  attachmentType: AttachmentType
): string | null {
  const limits = FILE_LIMITS[attachmentType];
  if (!limits) return `Unknown attachment type: ${attachmentType}`;

  if (!limits.mimeTypes.includes(file.type)) {
    return `Invalid file type. Accepted: ${limits.accept}`;
  }

  if (file.size > limits.maxSize) {
    const maxMB = limits.maxSize / (1024 * 1024);
    return `File too large. Maximum size is ${maxMB}MB.`;
  }

  return null;
}

/**
 * Validate multiple files for album upload
 */
export function validateAlbumFiles(files: File[]): string | null {
  const limits = FILE_LIMITS.album;

  if (files.length > limits.maxFiles) {
    return `Album can contain a maximum of ${limits.maxFiles} images.`;
  }

  for (const file of files) {
    const error = validateFile(file, 'album');
    if (error) return `${file.name}: ${error}`;
  }

  return null;
}
