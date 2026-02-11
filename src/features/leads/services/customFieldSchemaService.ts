/**
 * Custom Field Schema API Service
 * Handles all API calls for custom field schema management
 */

import api from '@/lib/api';
import type {
  CustomFieldSchema,
  CreateCustomFieldSchemaRequest,
  UpdateCustomFieldSchemaRequest,
  ReorderCustomFieldSchemasRequest,
  CursorPaginatedCustomFieldSchemaResponse,
} from '../types/customFieldSchema.types';

/**
 * Get all custom field schemas for an agent
 */
export const getCustomFieldSchemas = async (agentId: string): Promise<CustomFieldSchema[]> => {
  const requestUrl = `/api/agents/${agentId}/custom-field-schemas`;
  console.log('[CustomFieldSchemaService] ==========================================');
  console.log('[CustomFieldSchemaService] Fetching schemas for agent:', agentId);
  console.log('[CustomFieldSchemaService] Request URL:', requestUrl);
  console.log('[CustomFieldSchemaService] API client defaults:', api.defaults.baseURL);
  console.log('[CustomFieldSchemaService] Full URL will be:', `${api.defaults.baseURL}${requestUrl}`);

  try {
    const response = await api.get<CustomFieldSchema[]>(requestUrl);

    console.log('[CustomFieldSchemaService] Response status:', response.status);
    console.log('[CustomFieldSchemaService] Response headers:', response.headers);
    console.log('[CustomFieldSchemaService] Response data type:', typeof response.data);
    console.log('[CustomFieldSchemaService] Response data (first 200 chars):',
      typeof response.data === 'string'
        ? response.data.substring(0, 200)
        : JSON.stringify(response.data).substring(0, 200)
    );
    console.log('[CustomFieldSchemaService] Is Array?:', Array.isArray(response.data));
    console.log('[CustomFieldSchemaService] Array length:', Array.isArray(response.data) ? response.data.length : 'N/A');

    // If response.data is a string (HTML), something is very wrong
    if (typeof response.data === 'string') {
      console.error('[CustomFieldSchemaService] CRITICAL: Received HTML instead of JSON!');
      console.error('[CustomFieldSchemaService] Full response:', response.data);
      throw new Error('Received HTML response instead of JSON. Check API URL and CORS settings.');
    }

    return response.data;
  } catch (error: any) {
    console.error('[CustomFieldSchemaService] Error fetching schemas:', error);
    console.error('[CustomFieldSchemaService] Error response:', error.response);
    console.error('[CustomFieldSchemaService] Error status:', error.response?.status);
    console.error('[CustomFieldSchemaService] Error data:', error.response?.data);
    throw error;
  }
};

/**
 * Get only table-visible custom field schemas
 */
export const getTableCustomFieldSchemas = async (agentId: string): Promise<CustomFieldSchema[]> => {
  const response = await api.get<CustomFieldSchema[]>(
    `/api/agents/${agentId}/custom-field-schemas/table`
  );
  return response.data;
};

/**
 * Get custom field schemas with cursor pagination
 */
export const getCustomFieldSchemasCursor = async (
  agentId: string,
  params?: {
    limit?: number;
    cursor?: string;
    search?: string;
  }
): Promise<CursorPaginatedCustomFieldSchemaResponse> => {
  const response = await api.get<CursorPaginatedCustomFieldSchemaResponse>(
    `/api/agents/${agentId}/custom-field-schemas/cursor`,
    { params }
  );
  return response.data;
};

/**
 * Get a single custom field schema by ID
 */
export const getCustomFieldSchemaById = async (
  agentId: string,
  schemaId: string
): Promise<CustomFieldSchema> => {
  const response = await api.get<CustomFieldSchema>(
    `/api/agents/${agentId}/custom-field-schemas/${schemaId}`
  );
  return response.data;
};

/**
 * Create a new custom field schema
 */
export const createCustomFieldSchema = async (
  agentId: string,
  data: CreateCustomFieldSchemaRequest
): Promise<CustomFieldSchema> => {
  const response = await api.post<CustomFieldSchema>(
    `/api/agents/${agentId}/custom-field-schemas`,
    data
  );
  return response.data;
};

/**
 * Update an existing custom field schema
 */
export const updateCustomFieldSchema = async (
  agentId: string,
  schemaId: string,
  data: UpdateCustomFieldSchemaRequest
): Promise<CustomFieldSchema> => {
  const response = await api.put<CustomFieldSchema>(
    `/api/agents/${agentId}/custom-field-schemas/${schemaId}`,
    data
  );
  return response.data;
};

/**
 * Delete a custom field schema
 */
export const deleteCustomFieldSchema = async (
  agentId: string,
  schemaId: string
): Promise<void> => {
  await api.delete(`/api/agents/${agentId}/custom-field-schemas/${schemaId}`);
};

/**
 * Reorder custom field schemas
 */
export const reorderCustomFieldSchemas = async (
  agentId: string,
  data: ReorderCustomFieldSchemasRequest
): Promise<void> => {
  await api.put(`/api/agents/${agentId}/custom-field-schemas/reorder`, data);
};
