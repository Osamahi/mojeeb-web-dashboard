/**
 * Widget Service
 * API service for widget-related operations
 */

import api from '@/lib/api';
import type { WidgetConfiguration, UpdateWidgetRequest } from '../types/widget.types';

export interface WidgetSnippetResponse {
  snippet: string;
  widgetId: string;
}

/**
 * Convert snake_case object keys to camelCase
 */
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const camelCased: any = {};
  Object.keys(obj).forEach((key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelCased[camelKey] = toCamelCase(obj[key]);
  });
  return camelCased;
}

/**
 * Convert camelCase object keys to snake_case
 */
function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;

  const snakeCased: any = {};
  Object.keys(obj).forEach((key) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    snakeCased[snakeKey] = toSnakeCase(obj[key]);
  });
  return snakeCased;
}

/**
 * Get widget configuration by agent ID
 * Auto-creates widget if it doesn't exist
 */
export async function getWidgetByAgentId(agentId: string): Promise<WidgetConfiguration> {
  try {
    // Backend wraps response in { success, data, message, timestamp }
    const response = await api.get<{ success: boolean; data: any }>(
      `/api/widget/by-agent/${agentId}`
    );

    // Backend sends snake_case, convert to camelCase
    const widgetData = toCamelCase(response.data.data);

    // Debug logging
    console.log('🔍 Widget API Response (snake_case):', response.data.data);
    console.log('🔍 Converted Widget (camelCase):', widgetData);

    return widgetData as WidgetConfiguration;
  } catch (error) {
    console.error('Error fetching widget configuration:', error);
    throw new Error('Failed to fetch widget configuration. Please try again.');
  }
}

/**
 * Update widget configuration
 */
export async function updateWidget(
  widgetId: string,
  config: UpdateWidgetRequest
): Promise<WidgetConfiguration> {
  try {
    // Convert camelCase request to snake_case for backend
    const snakeCaseConfig = toSnakeCase(config);

    console.log('🔄 Update Request (camelCase):', config);
    console.log('🔄 Update Request (snake_case):', snakeCaseConfig);

    // Backend wraps response in { success, data, message, timestamp }
    const response = await api.put<{ success: boolean; data: any }>(
      `/api/widget/${widgetId}`,
      snakeCaseConfig
    );

    // Convert response from snake_case to camelCase
    const widgetData = toCamelCase(response.data.data);

    console.log('✅ Update Response (camelCase):', widgetData);

    return widgetData as WidgetConfiguration;
  } catch (error) {
    console.error('Error updating widget configuration:', error);
    throw new Error('Failed to update widget. Please try again.');
  }
}

/**
 * Get widget snippet for an agent
 * Fetches the default widget embed code snippet for the specified agent
 */
export async function getWidgetSnippet(agentId: string): Promise<string> {
  try {
    const response = await api.get<string>(`/api/widget/agent/${agentId}/default-snippet`);

    // Backend returns plain HTML string directly
    return response.data;
  } catch (error) {
    console.error('Error fetching widget snippet:', error);
    throw new Error('Failed to fetch widget snippet. Please try again.');
  }
}

/**
 * Get widget embed snippet by widget ID
 */
export async function getWidgetSnippetById(widgetId: string): Promise<string> {
  try {
    const response = await api.get<string>(`/api/widget/${widgetId}/snippet`);
    return response.data;
  } catch (error) {
    console.error('Error fetching widget snippet:', error);
    throw new Error('Failed to fetch widget snippet. Please try again.');
  }
}

/**
 * Widget Service Object
 * Provides methods for widget-related operations
 */
export const widgetService = {
  getWidgetByAgentId,
  updateWidget,
  getWidgetSnippet,
  getWidgetSnippetById,
};
