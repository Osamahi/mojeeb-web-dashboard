/**
 * Lead Type Definitions
 * Following Knowledge Base architecture patterns
 */

// ========================================
// Enums & Constants
// ========================================

export type LeadStatus = 'new' | 'processing' | 'completed';
export type LeadSource = 'web_form' | 'chat_widget' | 'manual' | 'api' | 'whatsapp' | 'instagram';
export type FieldType = 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'date';
export type NoteType = 'user_note' | 'status_change';

// ========================================
// Main Lead Interface (camelCase for frontend)
// ========================================

/**
 * Represents a single note in a lead's note history
 */
export interface LeadNote {
  id: string;
  userId: string;
  userName: string;
  text: string;
  noteType: NoteType;
  isEdited: boolean;
  isDeleted: boolean;
  metadata?: {
    statusChange?: {
      oldStatus: string;
      newStatus: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Main Lead entity
 */
export interface Lead {
  id: string;
  agentId: string;
  name: string | null;
  phone: string | null;
  status: LeadStatus;
  customFields: Record<string, any>;
  summary: string | null;
  notes: LeadNote[];  // Notes array
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// API Response Types (snake_case from backend)
// ========================================

export interface ApiLeadNoteResponse {
  id: string;
  created_by: string;  // Changed from user_id to match backend DTO
  user_name: string;
  text: string;
  note_type: NoteType;
  is_edited: boolean;
  is_deleted: boolean;
  metadata?: string | {  // Can be JSON string from backend or parsed object
    statusChange?: {
      oldStatus: string;
      newStatus: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface ApiLeadResponse {
  id: string;
  agent_id: string;
  name: string | null;
  phone: string | null;
  status: LeadStatus;
  custom_fields: Record<string, any>;
  summary: string | null;
  notes: ApiLeadNoteResponse[];  // Notes array
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

// ========================================
// CRUD Request DTOs
// ========================================

export interface CreateLeadRequest {
  agentId: string;
  name: string;
  phone?: string;
  status?: LeadStatus;
  customFields?: Record<string, any>;
  summary?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  phone?: string;
  status?: LeadStatus;
  customFields?: Record<string, any>;
  summary?: string;
}

/**
 * Request DTO for creating a new note
 */
export interface CreateNoteRequest {
  text: string;
  noteType?: NoteType;
}

/**
 * Request DTO for updating an existing note
 */
export interface UpdateNoteRequest {
  text: string;
}

// ========================================
// Custom Field Definitions
// ========================================

export interface LeadFieldDefinition {
  id: string;
  agentId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: FieldType;
  options: string[] | null;
  isRequired: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ApiLeadFieldDefinitionResponse {
  id: string;
  agent_id: string;
  field_key: string;
  field_label: string;
  field_type: FieldType;
  options: string[] | null;
  is_required: boolean;
  display_order: number;
  created_at: string;
}

export interface CreateFieldDefinitionRequest {
  agentId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: FieldType;
  options?: string[];
  isRequired?: boolean;
  displayOrder?: number;
}

// ========================================
// Statistics & Analytics
// ========================================

/**
 * Dynamic Lead Statistics
 *
 * Structure:
 * - total: Total count of all leads
 * - [status]: Dynamic key-value pairs for each status (e.g., new, processing, completed, cancelled, etc.)
 *
 * Example response:
 * {
 *   total: 150,
 *   new: 45,
 *   processing: 80,
 *   completed: 25
 * }
 *
 * Future-proof: Automatically supports new status values without code changes
 */
export interface LeadStatistics {
  total: number;
  [status: string]: number; // Dynamic status counts (new, processing, completed, cancelled, etc.)
}

// ========================================
// UI Helper Types
// ========================================

export type DatePreset = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'custom';

export interface LeadFilters {
  search: string;
  status: LeadStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginationMetadata {
  current_page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_more: boolean;
}

export interface PaginatedLeadsResponse {
  leads: ApiLeadResponse[];
  pagination: PaginationMetadata;
}

/**
 * Cursor-based pagination response (for infinite scroll)
 * No total count - optimized for constant-time performance
 */
export interface CursorPaginatedLeadsResponse {
  items: ApiLeadResponse[];
  next_cursor: string | null;  // Base64-encoded cursor for next page (null on last page)
  has_more: boolean;  // True if there are more pages available
}

export interface LeadFormData {
  name: string;
  phone: string;
  status: LeadStatus;
  summary: string;
  customFields: Record<string, any>;
}

export interface LeadFormErrors {
  name?: string;
  phone?: string;
  customFields?: Record<string, string>;
}
