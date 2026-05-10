/**
 * Integration service for connection CRUD against `/api/integrations`.
 * Handles snake_case (backend) ↔ camelCase (frontend) transformation.
 *
 * Google OAuth one-shot calls (auth-code exchange, picker-token fetch) live in
 * `./googleOAuthApi.ts` to keep the OAuth handoff visible separately from CRUD.
 */

import api from '@/lib/api';
import type {
  IntegrationConnection,
  ApiIntegrationConnectionResponse,
  CreateConnectionRequest,
  TestConnectionResult,
  SheetMetadataResponse,
} from '../types';

function transformConnection(apiConn: ApiIntegrationConnectionResponse): IntegrationConnection {
  return {
    id: apiConn.id,
    organizationId: apiConn.organization_id,
    connectorType: apiConn.connector_type,
    name: apiConn.name,
    description: apiConn.description,
    config: apiConn.config,
    isConnected: apiConn.is_connected,
    isTokenExpired: apiConn.is_token_expired,
    tokenExpiresAt: apiConn.token_expires_at,
    status: apiConn.status,
    lastTestedAt: apiConn.last_tested_at,
    lastError: apiConn.last_error,
    createdBy: apiConn.created_by,
    createdAt: apiConn.created_at || new Date().toISOString(),
    updatedAt: apiConn.updated_at || new Date().toISOString(),
  };
}

class IntegrationService {
  async getConnections(): Promise<IntegrationConnection[]> {
    const { data } = await api.get<{ data: ApiIntegrationConnectionResponse[] }>(
      '/api/integrations/connections'
    );
    return data.data.map(transformConnection);
  }

  async createConnection(request: CreateConnectionRequest): Promise<IntegrationConnection> {
    const payload = {
      connector_type: request.connectorType,
      name: request.name,
      description: request.description,
      config: request.config,
      oauth_session_id: request.oauthSessionId,
    };
    const { data } = await api.post<{ data: ApiIntegrationConnectionResponse }>(
      '/api/integrations/connections',
      payload
    );
    return transformConnection(data.data);
  }

  async deleteConnection(connectionId: string): Promise<void> {
    await api.delete(`/api/integrations/connections/${connectionId}`);
  }

  /**
   * Reconnect an existing integration connection with fresh OAuth tokens. The OAuth session ID
   * is obtained from `googleOAuthApi.exchangeAuthCode` — same handoff as create.
   */
  async reconnectConnection(connectionId: string, oauthSessionId: string): Promise<IntegrationConnection> {
    const { data } = await api.post<{ data: ApiIntegrationConnectionResponse }>(
      `/api/integrations/connections/${connectionId}/reconnect`,
      { oauth_session_id: oauthSessionId }
    );
    return transformConnection(data.data);
  }

  async testConnection(connectionId: string): Promise<TestConnectionResult> {
    const { data } = await api.post<{ data: TestConnectionResult }>(
      `/api/integrations/connections/${connectionId}/test`
    );
    return data.data;
  }

  async getConnectionMetadata(connectionId: string): Promise<SheetMetadataResponse> {
    // Generic endpoint; the response shape is connector-specific (Sheets returns
    // { spreadsheet_title, tabs }, Calendar would return calendars, etc.). The frontend
    // dispatches per-connector rendering off the connection's connector_type.
    const { data } = await api.get<{ data: SheetMetadataResponse }>(
      `/api/integrations/connections/${connectionId}/metadata`
    );
    return data.data;
  }
}

export const integrationService = new IntegrationService();
