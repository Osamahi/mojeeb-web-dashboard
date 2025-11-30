/**
 * Widget Service
 * API service for widget-related operations
 */

import api from '@/lib/api';

export interface WidgetSnippetResponse {
  snippet: string;
  widgetId: string;
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
 * Widget Service Object
 * Provides methods for widget-related operations
 */
export const widgetService = {
  getWidgetSnippet,
};
