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
  console.log('🔍 Calling Share Link API:', url);
  console.log('🔍 Params:', { mode, expirationDays });
  console.log('🔍 Full URL:', `${import.meta.env.VITE_API_URL}${url}`);

  const response = await api.get<{ data: ShareLinkResponse }>(
    url,
    {
      params: { mode, expirationDays },
    }
  );

  console.log('🔍 Share Link Response:', response);
  console.log('🔍 response.data:', response.data);
  console.log('🔍 response.data.data (snake_case):', response.data.data);

  // Convert snake_case to camelCase
  const snakeData = response.data.data as any;
  const camelData: ShareLinkResponse = {
    shareUrl: snakeData.share_url,
    token: snakeData.token,
    expiresAt: snakeData.expires_at,
    expirationDays: snakeData.expiration_days,
  };

  console.log('🔍 Converted to camelCase:', camelData);

  return camelData;
}

/**
 * Get installation data from a public share token
 * No authentication required
 */
export async function getInstallationData(token: string): Promise<InstallationData> {
  const response = await api.get<InstallationData>(
    `/api/widget/public/install/${token}`
  );

  return response.data;
}

export const installationLinkService = {
  generateShareLink,
  getInstallationData,
};
