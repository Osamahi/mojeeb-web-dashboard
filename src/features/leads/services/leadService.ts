/**
 * Lead Service
 * API service layer for lead operations
 * Follows Knowledge Base architecture with snake_case ↔ camelCase transformations
 */

import api from '@/lib/api';
import { parseNoteMetadata } from '../utils/noteHelpers';
import type {
  Lead,
  LeadNote,
  LeadFilters,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadStatistics,
  LeadFieldDefinition,
  ApiLeadResponse,
  ApiLeadNoteResponse,
  ApiLeadFieldDefinitionResponse,
  CreateFieldDefinitionRequest,
  CreateNoteRequest,
  UpdateNoteRequest,
  PaginatedLeadsResponse,
  PaginationMetadata,
} from '../types';

// Backend API Response Wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  timestamp?: string;
}

class LeadService {
  // ========================================
  // Transformation Methods (snake_case ↔ camelCase)
  // ========================================

  /**
   * Transform note API response (snake_case) to frontend model (camelCase)
   */
  private transformNote(apiNote: ApiLeadNoteResponse): LeadNote {
    console.log('[transformNote] 🔍 DEBUG: Received API note:', {
      id: apiNote.id,
      note_type: apiNote.note_type,
      is_deleted: apiNote.is_deleted,
      is_edited: apiNote.is_edited,
      text: apiNote.text?.substring(0, 30)
    });

    const transformed = {
      id: apiNote.id,
      userId: apiNote.created_by,
      userName: apiNote.user_name,
      text: apiNote.text,
      noteType: apiNote.note_type,
      isEdited: apiNote.is_edited,
      isDeleted: apiNote.is_deleted,
      metadata: parseNoteMetadata(apiNote.metadata),
      createdAt: apiNote.created_at,
      updatedAt: apiNote.updated_at,
    };

    console.log('[transformNote] 🔍 DEBUG: Transformed to frontend note:', {
      id: transformed.id,
      noteType: transformed.noteType,
      isDeleted: transformed.isDeleted,
      isEdited: transformed.isEdited,
      text: transformed.text?.substring(0, 30)
    });

    return transformed;
  }

  /**
   * Transform API response (snake_case) to frontend model (camelCase)
   */
  private transformLead(apiLead: ApiLeadResponse): Lead {
    console.log('[transformLead] 🔍 DEBUG: Received API lead:', {
      id: apiLead.id,
      name: apiLead.name,
      notes_count: apiLead.notes?.length || 0,
      first_note: apiLead.notes?.[0] ? {
        id: apiLead.notes[0].id,
        note_type: (apiLead.notes[0] as any).note_type,
        is_deleted: (apiLead.notes[0] as any).is_deleted,
        text: apiLead.notes[0].text?.substring(0, 20)
      } : null
    });

    const transformed = {
      id: apiLead.id,
      agentId: apiLead.agent_id,
      name: apiLead.name,
      phone: apiLead.phone,
      status: apiLead.status,
      customFields: apiLead.custom_fields,
      summary: apiLead.summary,
      notes: apiLead.notes?.map(c => this.transformNote(c)) || [],
      conversationId: apiLead.conversation_id,
      createdAt: apiLead.created_at,
      updatedAt: apiLead.updated_at,
    };

    console.log('[transformLead] 🔍 DEBUG: Transformed lead:', {
      id: transformed.id,
      name: transformed.name,
      notes_count: transformed.notes?.length || 0,
      first_note: transformed.notes?.[0] ? {
        id: transformed.notes[0].id,
        noteType: transformed.notes[0].noteType,
        isDeleted: transformed.notes[0].isDeleted,
        text: transformed.notes[0].text?.substring(0, 20)
      } : null
    });

    return transformed;
  }

  /**
   * Transform field definition API response to frontend model
   */
  private transformFieldDefinition(apiField: ApiLeadFieldDefinitionResponse): LeadFieldDefinition {
    return {
      id: apiField.id,
      agentId: apiField.agent_id,
      fieldKey: apiField.field_key,
      fieldLabel: apiField.field_label,
      fieldType: apiField.field_type,
      options: apiField.options,
      isRequired: apiField.is_required,
      displayOrder: apiField.display_order,
      createdAt: apiField.created_at,
    };
  }

  // ========================================
  // Lead CRUD Operations
  // ========================================

  /**
   * Get all leads for an agent with optional filters
   */
  async getLeads(agentId: string, filters?: Partial<LeadFilters>): Promise<Lead[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('agentId', agentId);

      if (filters) {
        if (filters.status && filters.status !== 'all') {
          params.append('status', filters.status);
        }
        if (filters.dateFrom) {
          params.append('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
          params.append('dateTo', filters.dateTo);
        }
        if (filters.search && filters.search.trim()) {
          params.append('search', filters.search.trim());
        }
      }

      const url = `/api/lead?${params.toString()}`;
      const { data } = await api.get<ApiResponse<ApiLeadResponse[]>>(url);
      return data.data.map(lead => this.transformLead(lead));
    } catch (error) {
      console.error('[LeadService] Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Get paginated leads for an agent with optional filters (for infinite scroll)
   */
  async getPaginatedLeads(
    agentId: string,
    filters?: Partial<LeadFilters>
  ): Promise<{ leads: Lead[]; pagination: PaginationMetadata }> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('agentId', agentId);

      if (filters) {
        if (filters.status && filters.status !== 'all') {
          params.append('status', filters.status);
        }
        if (filters.dateFrom) {
          params.append('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
          params.append('dateTo', filters.dateTo);
        }
        if (filters.search && filters.search.trim()) {
          params.append('search', filters.search.trim());
        }
        if (filters.page) {
          params.append('page', filters.page.toString());
        }
        if (filters.pageSize) {
          params.append('pageSize', filters.pageSize.toString());
        }
      }

      const url = `/api/lead?${params.toString()}`;
      const { data } = await api.get<ApiResponse<PaginatedLeadsResponse>>(url);

      // Check if response is paginated format
      if (data.data && typeof data.data === 'object' && 'leads' in data.data && 'pagination' in data.data) {
        return {
          leads: data.data.leads.map(lead => this.transformLead(lead)),
          pagination: data.data.pagination,
        };
      } else if (Array.isArray(data.data)) {
        throw new Error('Backend returned non-paginated response. Check if pagination parameters are being sent correctly.');
      } else {
        throw new Error('Unexpected API response format');
      }
    } catch (error) {
      console.error('[LeadService] Error fetching paginated leads:', error);
      throw error;
    }
  }

  /**
   * Get single lead by ID
   */
  async getLead(leadId: string): Promise<Lead> {
    const { data } = await api.get<ApiResponse<ApiLeadResponse>>(`/api/lead/${leadId}`);
    return this.transformLead(data.data);
  }

  /**
   * Create a new lead
   */
  async createLead(request: CreateLeadRequest): Promise<Lead> {
    // Transform to snake_case for backend
    const payload = {
      agent_id: request.agentId,
      name: request.name,
      phone: request.phone,
      status: request.status || 'new',
      custom_fields: request.customFields || {},
      summary: request.summary,
    };

    // Backend returns lead object directly (not wrapped)
    const { data } = await api.post<ApiLeadResponse>('/api/lead', payload);
    return this.transformLead(data);
  }

  /**
   * Update an existing lead
   */
  async updateLead(leadId: string, request: UpdateLeadRequest): Promise<Lead> {
    // Transform to snake_case for backend
    const payload: Partial<Record<string, any>> = {};

    if (request.name !== undefined) payload.name = request.name;
    if (request.phone !== undefined) payload.phone = request.phone;
    if (request.status !== undefined) payload.status = request.status;
    if (request.customFields !== undefined) payload.custom_fields = request.customFields;
    if (request.summary !== undefined) payload.summary = request.summary;

    const { data } = await api.put<ApiResponse<ApiLeadResponse>>(`/api/lead/${leadId}`, payload);
    return this.transformLead(data.data);
  }

  /**
   * Delete a lead
   */
  async deleteLead(leadId: string): Promise<void> {
    await api.delete(`/api/lead/${leadId}`);
  }

  // ========================================
  // Statistics & Analytics
  // ========================================

  /**
   * Get lead statistics for an agent
   */
  async getLeadStatistics(agentId: string): Promise<LeadStatistics> {
    const { data } = await api.get<ApiResponse<Record<string, number>>>(`/api/lead/statistics/${agentId}`);

    // Backend returns wrapped: { success: true, data: { "new": 5, "processing": 3, ... } }
    const stats = data.data;
    return {
      new: stats.new || 0,
      processing: stats.processing || 0,
      completed: stats.completed || 0,
      total: Object.values(stats).reduce((sum, val) => sum + val, 0),
    };
  }

  // ========================================
  // Custom Field Definitions
  // ========================================

  /**
   * Get custom field definitions for an agent
   */
  async getFieldDefinitions(agentId: string): Promise<LeadFieldDefinition[]> {
    const { data } = await api.get<ApiResponse<ApiLeadFieldDefinitionResponse[]>>(
      `/api/lead/field-definitions/${agentId}`
    );
    return data.data.map(field => this.transformFieldDefinition(field));
  }

  /**
   * Create a custom field definition
   */
  async createFieldDefinition(request: CreateFieldDefinitionRequest): Promise<LeadFieldDefinition> {
    // Transform to snake_case for backend
    const payload = {
      agent_id: request.agentId,
      field_key: request.fieldKey,
      field_label: request.fieldLabel,
      field_type: request.fieldType,
      options: request.options,
      is_required: request.isRequired ?? false,
      display_order: request.displayOrder ?? 0,
    };

    const { data } = await api.post<ApiResponse<ApiLeadFieldDefinitionResponse>>(
      '/api/lead/field-definitions',
      payload
    );
    return this.transformFieldDefinition(data.data);
  }

  /**
   * Delete a custom field definition
   */
  async deleteFieldDefinition(fieldId: string): Promise<void> {
    await api.delete(`/api/lead/field-definitions/${fieldId}`);
  }

  // ========================================
  // Note Operations
  // ========================================

  /**
   * Get all notes for a lead (excludes soft-deleted by default)
   */
  async getLeadNotes(leadId: string, includeDeleted = false): Promise<LeadNote[]> {
    const { data } = await api.get<ApiResponse<ApiLeadNoteResponse[]>>(
      `/api/lead/${leadId}/notes`,
      { params: { includeDeleted } }
    );
    return data.data.map(note => this.transformNote(note));
  }

  /**
   * Add a note to a lead
   */
  async createLeadNote(leadId: string, request: CreateNoteRequest): Promise<LeadNote> {
    // Transform to snake_case for backend
    const payload = {
      text: request.text,
      note_type: request.noteType || 'user_note',
    };

    const { data } = await api.post<ApiResponse<ApiLeadNoteResponse>>(
      `/api/lead/${leadId}/notes`,
      payload
    );
    return this.transformNote(data.data);
  }

  /**
   * Update an existing note (only by note owner)
   */
  async updateLeadNote(
    leadId: string,
    noteId: string,
    request: UpdateNoteRequest
  ): Promise<LeadNote> {
    // Transform to snake_case for backend
    const payload = {
      text: request.text,
    };

    const { data } = await api.put<ApiResponse<ApiLeadNoteResponse>>(
      `/api/lead/${leadId}/notes/${noteId}`,
      payload
    );
    return this.transformNote(data.data);
  }

  /**
   * Delete a note (soft delete, only by note owner)
   */
  async deleteLeadNote(leadId: string, noteId: string): Promise<void> {
    await api.delete(`/api/lead/${leadId}/notes/${noteId}`);
  }
}

// Export singleton instance
export const leadService = new LeadService();
