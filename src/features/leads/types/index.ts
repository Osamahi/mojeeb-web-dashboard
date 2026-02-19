/**
 * Lead Types - Public API
 * Export all type definitions
 */

export type {
  // Main Types
  Lead,
  LeadNote,
  LeadStatus,
  FieldType,
  NoteType,

  // API Types
  ApiLeadResponse,
  ApiLeadNoteResponse,
  ApiLeadFieldDefinitionResponse,

  // Request DTOs
  CreateLeadRequest,
  UpdateLeadRequest,
  CreateFieldDefinitionRequest,
  CreateNoteRequest,
  UpdateNoteRequest,

  // Custom Fields
  LeadFieldDefinition,

  // UI Helpers
  LeadFilters,
  LeadFormErrors,
} from './lead.types';
