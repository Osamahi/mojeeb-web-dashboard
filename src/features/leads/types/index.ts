/**
 * Lead Types - Public API
 * Export all type definitions
 */

export type {
  // Main Types
  Lead,
  LeadNote,
  LeadStatus,
  NoteType,

  // API Types
  ApiLeadResponse,
  ApiLeadNoteResponse,

  // Request DTOs
  CreateLeadRequest,
  UpdateLeadRequest,
  CreateNoteRequest,
  UpdateNoteRequest,

  // UI Helpers
  LeadFilters,
  LeadFormErrors,
} from './lead.types';
