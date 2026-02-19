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
} from '../types/customFieldSchema.types';

/**
 * Get all custom field schemas for an agent
 */
export const getCustomFieldSchemas = async (agentId: string): Promise<CustomFieldSchema[]> => {
  const response = await api.get<CustomFieldSchema[]>(
    `/api/agents/${agentId}/custom-field-schemas`
  );
  return response.data;
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
