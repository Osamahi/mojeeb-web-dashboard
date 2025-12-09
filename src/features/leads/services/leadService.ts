/**
 * Lead Service
 * API service layer for lead operations
 * Follows Knowledge Base architecture with snake_case ↔ camelCase transformations
 */

import api from '@/lib/api';
import type {
  Lead,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadStatistics,
  LeadFieldDefinition,
  ApiLeadResponse,
  ApiLeadFieldDefinitionResponse,
  CreateFieldDefinitionRequest,
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
   * Transform API response (snake_case) to frontend model (camelCase)
   */
  private transformLead(apiLead: ApiLeadResponse): Lead {
    return {
      id: apiLead.id,
      agentId: apiLead.agent_id,
      name: apiLead.name,
      phone: apiLead.phone,
      status: apiLead.status,
      customFields: apiLead.custom_fields,
      notes: apiLead.notes,
      conversationId: apiLead.conversation_id,
      createdAt: apiLead.created_at,
      updatedAt: apiLead.updated_at,
    };
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
   * Get all leads for an agent
   */
  async getLeads(agentId: string): Promise<Lead[]> {
    const { data } = await api.get<ApiResponse<ApiLeadResponse[]>>(`/api/lead?agentId=${agentId}`);
    return data.data.map(lead => this.transformLead(lead));
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
      notes: request.notes,
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
    if (request.notes !== undefined) payload.notes = request.notes;

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

    // Backend returns wrapped: { success: true, data: { "new": 5, "contacted": 3, ... } }
    const stats = data.data;
    return {
      new: stats.new || 0,
      contacted: stats.contacted || 0,
      qualified: stats.qualified || 0,
      converted: stats.converted || 0,
      lost: stats.lost || 0,
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
}

// Export singleton instance
export const leadService = new LeadService();
