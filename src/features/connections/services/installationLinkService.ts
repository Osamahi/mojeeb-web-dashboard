/**
 * Installation Link Service
 * Handles generation and retrieval of shareable widget installation links
 */

import api from '@/lib/api';

export interface ShareLinkResponse {
  shareUrl: string;
  token: string;
  expiresAt: string;
  expirationDays: number;
}

export interface InstallationData {
  widgetId: string;
  mode: 'default' | 'headless';
  snippet: string;
  agentName: string;
  expiresAt: string;
}

/**
 * Generate a shareable installation link for a widget
 */
export async function generateShareLink(
  widgetId: string,
  mode: 'default' | 'headless' = 'default',
  expirationDays: number = 30
): Promise<ShareLinkResponse> {
  const url = `/api/widget/${widgetId}/share-link`;

  const response = await api.get<{ data: ShareLinkResponse }>(
    url,
    {
      params: { mode, expirationDays },
    }
  );

  // Convert snake_case to camelCase
  const snakeData = response.data.data as any;
  const camelData: ShareLinkResponse = {
    shareUrl: snakeData.share_url,
    token: snakeData.token,
    expiresAt: snakeData.expires_at,
    expirationDays: snakeData.expiration_days,
  };

  return camelData;
}

/**
 * Get installation data from a public share token
 * No authentication required
 */
export async function getInstallationData(token: string): Promise<InstallationData> {
  const response = await api.get<{ data: any }>(
    `/api/widget/public/install/${token}`
  );

  // Convert snake_case to camelCase
  const snakeData = response.data.data;
  const camelData: InstallationData = {
    widgetId: snakeData.widget_id || snakeData.widgetId,
    mode: snakeData.mode,
    snippet: snakeData.snippet,
    agentName: snakeData.agent_name || snakeData.agentName,
    expiresAt: snakeData.expires_at || snakeData.expiresAt,
  };

  return camelData;
}

export const installationLinkService = {
  generateShareLink,
  getInstallationData,
};
