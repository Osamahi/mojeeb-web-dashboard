/**
 * Formatting utilities for displaying attachment data
 */

import type { AttachmentType } from '../types/attachment.types';

/**
 * Format attachment type for display
 */
export function formatAttachmentType(type: AttachmentType): string {
  const labels: Record<AttachmentType, string> = {
    photo: 'Photo',
    album: 'Album',
    video: 'Video',
    document: 'Document',
  };
  return labels[type] || type;
}

/**
 * Get color class for attachment type badge
 */
export function getAttachmentTypeColor(type: AttachmentType): string {
  const colors: Record<AttachmentType, string> = {
    photo: 'bg-blue-100 text-blue-700 border-blue-200',
    album: 'bg-purple-100 text-purple-700 border-purple-200',
    video: 'bg-orange-100 text-orange-700 border-orange-200',
    document: 'bg-green-100 text-green-700 border-green-200',
  };
  return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
}

/**
 * Check if attachment has media uploaded
 */
export function hasMedia(mediaConfig: Record<string, any> | null): boolean {
  if (!mediaConfig) return false;
  // Single file: has blob_name
  if (mediaConfig.blob_name) return true;
  // Album: has images array with items
  if (Array.isArray(mediaConfig.images) && mediaConfig.images.length > 0) return true;
  return false;
}

/**
 * Truncate long text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}


/**
 * Get color class for priority badge
 */
export function getPriorityColor(priority: number): string {
  if (priority >= 900) return 'bg-red-100 text-red-700 border-red-200';
  if (priority >= 700) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (priority >= 400) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (priority >= 100) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}
