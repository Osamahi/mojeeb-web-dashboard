/**
 * React Query mutation hooks for attachment CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentService } from '../services/attachmentService';
import type { CreateAttachmentRequest, UpdateAttachmentRequest } from '../types/attachment.types';
import { useAgentContext } from '@/hooks/useAgentContext';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';

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
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: (request: CreateAttachmentRequest) =>
      attachmentService.createAttachment(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', agentId] });
      toast.success('Attachment created successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to create attachment'));
    },
  });
}

/**
 * Update attachment mutation
 */
export function useUpdateAttachment() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: ({
      attachmentId,
      request,
    }: {
      attachmentId: string;
      request: UpdateAttachmentRequest;
    }) => {
      if (!agentId) throw new Error('No agent selected');
      return attachmentService.updateAttachment(attachmentId, agentId, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', agentId] });
      toast.success('Attachment updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update attachment'));
    },
  });
}

/**
 * Delete attachment mutation
 */
export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: (attachmentId: string) => {
      if (!agentId) throw new Error('No agent selected');
      return attachmentService.deleteAttachment(attachmentId, agentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', agentId] });
      toast.success('Attachment deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to delete attachment'));
    },
  });
}

/**
 * Toggle attachment active status mutation
 */
export function useToggleAttachment() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: ({
      attachmentId,
      isActive,
    }: {
      attachmentId: string;
      isActive: boolean;
    }) => {
      if (!agentId) throw new Error('No agent selected');
      return attachmentService.toggleAttachment(attachmentId, agentId, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', agentId] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to toggle attachment'));
    },
  });
}

/**
 * Upload single file mutation
 */
export function useUploadAttachmentFile() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: ({
      attachmentId,
      file,
      onProgress,
    }: {
      attachmentId: string;
      file: File;
      onProgress?: (percent: number) => void;
    }) => {
      if (!agentId) throw new Error('No agent selected');
      return attachmentService.uploadFile(attachmentId, agentId, file, onProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', agentId] });
      toast.success('File uploaded successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to upload file'));
    },
  });
}

/**
 * Upload album files mutation
 */
export function useUploadAlbumFiles() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: ({
      attachmentId,
      files,
      onProgress,
    }: {
      attachmentId: string;
      files: File[];
      onProgress?: (percent: number) => void;
    }) => {
      if (!agentId) throw new Error('No agent selected');
      return attachmentService.uploadAlbum(attachmentId, agentId, files, onProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', agentId] });
      toast.success('Album uploaded successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to upload album'));
    },
  });
}
