/**
 * Lead Type Definitions
 * Following Knowledge Base architecture patterns
 */

// ========================================
// Enums & Constants
// ========================================

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadSource = 'web_form' | 'chat_widget' | 'manual' | 'api' | 'whatsapp' | 'instagram';
export type FieldType = 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'date';

// ========================================
// Main Lead Interface (camelCase for frontend)
// ========================================

export interface Lead {
  id: string;
  agentId: string;
  name: string | null;
  phone: string | null;
  status: LeadStatus;
  customFields: Record<string, any>;
  notes: string | null;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// API Response Types (snake_case from backend)
// ========================================

export interface ApiLeadResponse {
  id: string;
  agent_id: string;
  name: string | null;
  phone: string | null;
  status: LeadStatus;
  custom_fields: Record<string, any>;
  notes: string | null;
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
  notes?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  phone?: string;
  status?: LeadStatus;
  customFields?: Record<string, any>;
  notes?: string;
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

export interface LeadStatistics {
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  lost: number;
  total: number;
}

// ========================================
// UI Helper Types
// ========================================

export interface LeadFilters {
  search: string;
  status: LeadStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export interface LeadFormData {
  name: string;
  phone: string;
  status: LeadStatus;
  notes: string;
  customFields: Record<string, any>;
}

export interface LeadFormErrors {
  name?: string;
  phone?: string;
  customFields?: Record<string, string>;
}
