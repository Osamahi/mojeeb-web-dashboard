/**
 * Attachment types and interfaces for the Attachments feature
 * Frontend uses camelCase, backend uses snake_case (transformation in service layer)
 */

// Attachment types supported by the system
export type AttachmentType = 'photo' | 'album' | 'video' | 'document';

/**
 * Frontend model (camelCase)
 */
export interface Attachment {
  id: string;
  agentId: string;
  name: string;
  description: string | null;
  triggerPrompt: string;
  attachmentType: AttachmentType;
  mediaConfig: Record<string, any> | null;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Backend API response (snake_case)
 */
export interface ApiAttachmentResponse {
  id: string;
  agent_id: string;
  name: string;
  description: string | null;
  trigger_prompt: string;
  attachment_type: string;
  media_config: Record<string, any> | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

/**
 * Create attachment request (frontend → backend)
 */
export interface CreateAttachmentRequest {
  agentId: string;
  name: string;
  description?: string;
  triggerPrompt: string;
  attachmentType: AttachmentType;
  isActive: boolean;
  priority: number;
}

/**
 * Update attachment request (frontend → backend)
 */
export interface UpdateAttachmentRequest {
  name?: string;
  description?: string;
  triggerPrompt?: string;
  attachmentType?: AttachmentType;
  isActive?: boolean;
  priority?: number;
}

/**
 * Filter options for attachments list
 */
export interface AttachmentFilters {
  attachmentType?: AttachmentType;
  isActive?: boolean;
  search?: string;
}

/**
 * Cursor-paginated response from backend
 */
export interface CursorPaginatedAttachmentsResponse {
  items: ApiAttachmentResponse[];
  next_cursor: string | null;
  has_more: boolean;
}
