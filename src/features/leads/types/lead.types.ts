/**
 * Lead Type Definitions
 * Following Knowledge Base architecture patterns
 */

// ========================================
// Enums & Constants
// ========================================

// Dynamic: status values are defined per-agent in custom_field_schemas (field_key='status')
// Defaults: 'new', 'processing', 'completed' — but agents can customize
export type LeadStatus = string;
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
  assignedTo: string | null;  // User id of the assignee. Mirrored with the linked conversation.
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
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

// ========================================
// Assignment types
// ========================================

/**
 * Filter value for the assignee filter. Special tokens:
 *   - "me"         — assigned to the authenticated user
 *   - "unassigned" — assigned_to IS NULL
 *   - any other    — user UUID
 *   - null/undef   — no filter
 */
export type AssigneeFilter = string | 'me' | 'unassigned' | null;

export interface AssignLeadRequest {
  assignedTo: string | null;  // null = unassign
  reason?: string;
}

export interface ApiAssignmentResponse {
  lead_id: string | null;
  conversation_id: string | null;
  agent_id: string;
  assigned_to: string | null;
  changed_at: string;
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
// UI Helper Types
// ========================================

export type DatePreset = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'custom';

export interface LeadFilters {
  search: string;
  status: LeadStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  /** "me" | "unassigned" | user UUID. undefined = no filter. */
  assignedTo?: AssigneeFilter;
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

export interface LeadFormErrors {
  name?: string;
  phone?: string;
  customFields?: Record<string, string>;
}
