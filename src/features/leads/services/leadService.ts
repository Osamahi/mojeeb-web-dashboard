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
  ApiLeadResponse,
  ApiLeadNoteResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
} from '../types';
import type { CursorPaginatedLeadsResponse } from '../types/lead.types';

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

    return transformed;
  }

  /**
   * Transform API response (snake_case) to frontend model (camelCase)
   */
  private transformLead(apiLead: ApiLeadResponse): Lead {
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

    return transformed;
  }

  // ========================================
  // Lead CRUD Operations
  // ========================================

  /**
   * Get leads with cursor-based pagination (optimized for infinite scroll)
   * Returns next_cursor and has_more for efficient pagination without COUNT(*)
   */
  async getLeadsCursor(
    agentId: string,
    limit: number = 50,
    cursor?: string,
    filters?: Partial<LeadFilters>
  ): Promise<{ leads: Lead[]; nextCursor: string | null; hasMore: boolean }> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('agentId', agentId);
      params.append('limit', limit.toString());

      if (cursor) {
        params.append('cursor', cursor);
      }

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

      const url = `/api/lead/cursor?${params.toString()}`;
      const { data } = await api.get<ApiResponse<CursorPaginatedLeadsResponse>>(url);

      return {
        leads: data.data.items.map(lead => this.transformLead(lead)),
        nextCursor: data.data.next_cursor,
        hasMore: data.data.has_more,
      };
    } catch (error) {
      console.error('[LeadService] Error fetching leads with cursor:', error);
      throw error;
    }
  }

  /**
   * Get single lead by ID
   */
  async getLead(leadId: string, agentId: string): Promise<Lead> {
    const { data } = await api.get<ApiResponse<ApiLeadResponse>>(`/api/lead/${leadId}?agentId=${agentId}`);
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
  async updateLead(leadId: string, agentId: string, request: UpdateLeadRequest): Promise<Lead> {
    // Transform to snake_case for backend
    const payload: Partial<Record<string, any>> = {};

    if (request.name !== undefined) payload.name = request.name;
    if (request.phone !== undefined) payload.phone = request.phone;
    if (request.status !== undefined) payload.status = request.status;
    if (request.customFields !== undefined) payload.custom_fields = request.customFields;
    if (request.summary !== undefined) payload.summary = request.summary;

    const { data } = await api.put<ApiResponse<ApiLeadResponse>>(
      `/api/lead/${leadId}?agentId=${agentId}`,
      payload
    );
    return this.transformLead(data.data);
  }

  /**
   * Delete a lead
   */
  async deleteLead(leadId: string, agentId: string): Promise<void> {
    await api.delete(`/api/lead/${leadId}?agentId=${agentId}`);
  }

  // ========================================
  // Note Operations
  // ========================================

  /**
   * Get all notes for a lead (excludes soft-deleted by default)
   */
  async getLeadNotes(leadId: string, agentId: string, includeDeleted = false): Promise<LeadNote[]> {
    const { data } = await api.get<ApiResponse<ApiLeadNoteResponse[]>>(
      `/api/lead/${leadId}/notes`,
      { params: { agentId, includeDeleted } }
    );
    return data.data.map(note => this.transformNote(note));
  }

  /**
   * Add a note to a lead
   */
  async createLeadNote(leadId: string, agentId: string, request: CreateNoteRequest): Promise<LeadNote> {
    // Transform to snake_case for backend
    const payload = {
      text: request.text,
      note_type: request.noteType || 'user_note',
    };

    const { data } = await api.post<ApiResponse<ApiLeadNoteResponse>>(
      `/api/lead/${leadId}/notes?agentId=${agentId}`,
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
    agentId: string,
    request: UpdateNoteRequest
  ): Promise<LeadNote> {
    // Transform to snake_case for backend
    const payload = {
      text: request.text,
    };

    const { data } = await api.put<ApiResponse<ApiLeadNoteResponse>>(
      `/api/lead/${leadId}/notes/${noteId}?agentId=${agentId}`,
      payload
    );
    return this.transformNote(data.data);
  }

  /**
   * Delete a note (soft delete, only by note owner)
   */
  async deleteLeadNote(leadId: string, noteId: string, agentId: string): Promise<void> {
    await api.delete(`/api/lead/${leadId}/notes/${noteId}?agentId=${agentId}`);
  }
}

// Export singleton instance
export const leadService = new LeadService();
