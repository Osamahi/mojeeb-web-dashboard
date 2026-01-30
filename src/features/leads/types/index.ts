/**
 * Lead Types - Public API
 * Export all type definitions
 */

export type {
  // Main Types
  Lead,
  LeadNote,
  LeadStatus,
  LeadSource,
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

  // Statistics
  LeadStatistics,

  // UI Helpers
  LeadFilters,
  LeadFormData,
  LeadFormErrors,
} from './lead.types';
