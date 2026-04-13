/**
 * React Query mutation hooks for attachment CRUD operations
 * All mutations accept agentId explicitly (not from agent context)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentService } from '../services/attachmentService';
import type { CreateAttachmentRequest, UpdateAttachmentRequest } from '../types/attachment.types';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { isToastHandled } from '@/lib/errors';
import { analytics } from '@/lib/analytics/core/AnalyticsService';

function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
}

/**
 * Create attachment mutation
 */
export function useCreateAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateAttachmentRequest) =>
      attachmentService.createAttachment(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      toast.success('Attachment created successfully');
    },
    onError: (error: unknown) => {
      if (!isToastHandled(error)) toast.error(getErrorMessage(error, 'Failed to create attachment'));
    },
  });
}

/**
 * Update attachment mutation
 */
export function useUpdateAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attachmentId,
      agentId,
      request,
    }: {
      attachmentId: string;
      agentId: string;
      request: UpdateAttachmentRequest;
    }) => {
      return attachmentService.updateAttachment(attachmentId, agentId, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      toast.success('Attachment updated successfully');
    },
    onError: (error: unknown) => {
      if (!isToastHandled(error)) toast.error(getErrorMessage(error, 'Failed to update attachment'));
    },
  });
}

/**
 * Delete attachment mutation
 */
export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attachmentId, agentId }: { attachmentId: string; agentId: string }) => {
      return attachmentService.deleteAttachment(attachmentId, agentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      toast.success('Attachment deleted successfully');
    },
    onError: (error: unknown) => {
      if (!isToastHandled(error)) toast.error(getErrorMessage(error, 'Failed to delete attachment'));
    },
  });
}

/**
 * Toggle attachment active status mutation
 */
export function useToggleAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attachmentId,
      agentId,
      isActive,
    }: {
      attachmentId: string;
      agentId: string;
      isActive: boolean;
    }) => {
      return attachmentService.toggleAttachment(attachmentId, agentId, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
    },
    onError: (error: unknown) => {
      if (!isToastHandled(error)) toast.error(getErrorMessage(error, 'Failed to toggle attachment'));
    },
  });
}

/**
 * Upload single file mutation
 */
export function useUploadAttachmentFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attachmentId,
      agentId,
      file,
      onProgress,
    }: {
      attachmentId: string;
      agentId: string;
      file: File;
      onProgress?: (percent: number) => void;
    }) => {
      return attachmentService.uploadFile(attachmentId, agentId, file, onProgress);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      toast.success('File uploaded successfully');

      // Track KB upload for funnel (first-only dedup handled by FunnelProvider)
      analytics.track('knowledge_base_added', {
        agentId: variables.agentId,
        userId: '',
      });
    },
    onError: (error: unknown) => {
      if (!isToastHandled(error)) toast.error(getErrorMessage(error, 'Failed to upload file'));
    },
  });
}

/**
 * Upload album files mutation
 */
export function useUploadAlbumFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attachmentId,
      agentId,
      files,
      onProgress,
    }: {
      attachmentId: string;
      agentId: string;
      files: File[];
      onProgress?: (percent: number) => void;
    }) => {
      return attachmentService.uploadAlbum(attachmentId, agentId, files, onProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      toast.success('Album uploaded successfully');
    },
    onError: (error: unknown) => {
      if (!isToastHandled(error)) toast.error(getErrorMessage(error, 'Failed to upload album'));
    },
  });
}
