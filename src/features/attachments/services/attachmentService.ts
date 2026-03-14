/**
 * Attachment service for API communication
 * Handles snake_case (backend) ↔ camelCase (frontend) transformation
 */

import api from '@/lib/api';
import type {
  Attachment,
  AttachmentType,
  ApiAttachmentResponse,
  CreateAttachmentRequest,
  UpdateAttachmentRequest,
  AttachmentFilters,
  CursorPaginatedAttachmentsResponse,
} from '../types/attachment.types';

const VALID_ATTACHMENT_TYPES: AttachmentType[] = ['photo', 'album', 'video', 'document'];

/**
 * Transform snake_case API response to camelCase frontend model
 */
function transformAttachment(apiAttachment: ApiAttachmentResponse): Attachment {
  const attachmentType = VALID_ATTACHMENT_TYPES.includes(apiAttachment.attachment_type as AttachmentType)
    ? (apiAttachment.attachment_type as AttachmentType)
    : 'photo';

  return {
    id: apiAttachment.id,
    agentId: apiAttachment.agent_id,
    name: apiAttachment.name,
    description: apiAttachment.description,
    triggerPrompt: apiAttachment.trigger_prompt,
    attachmentType,
    mediaConfig: apiAttachment.media_config,
    isActive: apiAttachment.is_active,
    priority: apiAttachment.priority,
    createdAt: apiAttachment.created_at,
    updatedAt: apiAttachment.updated_at,
  };
}

/**
 * Transform camelCase frontend create request to snake_case backend request
 */
function transformCreateRequest(request: CreateAttachmentRequest): Record<string, unknown> {
  return {
    agent_id: request.agentId,
    name: request.name,
    description: request.description,
    trigger_prompt: request.triggerPrompt,
    attachment_type: request.attachmentType,
    is_active: request.isActive,
    priority: request.priority,
  };
}

/**
 * Transform camelCase update request to snake_case backend request
 */
function transformUpdateRequest(request: UpdateAttachmentRequest): Record<string, unknown> {
  const transformed: Record<string, unknown> = {};

  if (request.name !== undefined) transformed.name = request.name;
  if (request.description !== undefined) transformed.description = request.description;
  if (request.triggerPrompt !== undefined) transformed.trigger_prompt = request.triggerPrompt;
  if (request.attachmentType !== undefined) transformed.attachment_type = request.attachmentType;
  if (request.isActive !== undefined) transformed.is_active = request.isActive;
  if (request.priority !== undefined) transformed.priority = request.priority;

  return transformed;
}

class AttachmentService {
  /**
   * Get attachments with cursor pagination for a specific agent
   */
  async getAttachmentsCursor(
    agentId: string,
    limit: number = 50,
    cursor?: string,
    filters?: AttachmentFilters
  ): Promise<{ attachments: Attachment[]; nextCursor: string | null; hasMore: boolean }> {
    const params = new URLSearchParams();
    params.append('agentId', agentId);
    params.append('limit', limit.toString());

    if (cursor) {
      params.append('cursor', cursor);
    }

    if (filters?.attachmentType) {
      params.append('attachmentType', filters.attachmentType);
    }

    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    const url = `/api/attachments?${params.toString()}`;
    const { data } = await api.get<{ data: CursorPaginatedAttachmentsResponse }>(url);

    return {
      attachments: data.data.items.map(transformAttachment),
      nextCursor: data.data.next_cursor,
      hasMore: data.data.has_more,
    };
  }

  /**
   * Get ALL attachments across all agents (SuperAdmin only)
   */
  async getAllAttachmentsCursor(
    limit: number = 50,
    cursor?: string,
    filters?: AttachmentFilters
  ): Promise<{ attachments: Attachment[]; nextCursor: string | null; hasMore: boolean }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    if (cursor) {
      params.append('cursor', cursor);
    }

    if (filters?.attachmentType) {
      params.append('attachmentType', filters.attachmentType);
    }

    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    const url = `/api/attachments/all?${params.toString()}`;
    const { data } = await api.get<{ data: CursorPaginatedAttachmentsResponse }>(url);

    return {
      attachments: data.data.items.map(transformAttachment),
      nextCursor: data.data.next_cursor,
      hasMore: data.data.has_more,
    };
  }

  /**
   * Create a new attachment
   * Note: Backend returns raw object (CreatedAtAction), not {data:...} wrapper
   */
  async createAttachment(request: CreateAttachmentRequest): Promise<Attachment> {
    const payload = transformCreateRequest(request);
    const { data } = await api.post<ApiAttachmentResponse>('/api/attachments', payload);
    return transformAttachment(data);
  }

  /**
   * Update an existing attachment
   */
  async updateAttachment(
    attachmentId: string,
    agentId: string,
    request: UpdateAttachmentRequest
  ): Promise<Attachment> {
    const payload = transformUpdateRequest(request);
    const { data } = await api.put<{ data: ApiAttachmentResponse }>(
      `/api/attachments/${attachmentId}?agentId=${agentId}`,
      payload
    );
    return transformAttachment(data.data);
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string, agentId: string): Promise<void> {
    await api.delete(`/api/attachments/${attachmentId}?agentId=${agentId}`);
  }

  /**
   * Toggle attachment active status
   */
  async toggleAttachment(
    attachmentId: string,
    agentId: string,
    isActive: boolean
  ): Promise<Attachment> {
    const { data } = await api.post<{ data: ApiAttachmentResponse }>(
      `/api/attachments/${attachmentId}/toggle?agentId=${agentId}`,
      { is_active: isActive }
    );
    return transformAttachment(data.data);
  }

  /**
   * Upload a single file for an attachment (photo, video, or document)
   */
  async uploadFile(
    attachmentId: string,
    agentId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<{ data: ApiAttachmentResponse }>(
      `/api/attachments/${attachmentId}/upload?agentId=${agentId}`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );
    return transformAttachment(data.data);
  }

  /**
   * Upload multiple files for an album attachment (max 10 images)
   */
  async uploadAlbum(
    attachmentId: string,
    agentId: string,
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<Attachment> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const { data } = await api.post<{ data: ApiAttachmentResponse }>(
      `/api/attachments/${attachmentId}/upload-album?agentId=${agentId}`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );
    return transformAttachment(data.data);
  }
}

export const attachmentService = new AttachmentService();
