/**
 * Integration service for API communication
 * Handles snake_case (backend) ↔ camelCase (frontend) transformation
 */

import api from '@/lib/api';
import type {
  IntegrationConnection,
  ApiIntegrationConnectionResponse,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  TestConnectionResult,
  ConnectorInfo,
  SheetMetadataResponse,
} from '../types';

/**
 * Transform snake_case API response to camelCase frontend model
 */
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
  /**
   * Get available connector types
   */
  async getConnectorTypes(): Promise<ConnectorInfo[]> {
    const { data } = await api.get<{ data: ConnectorInfo[] }>('/api/integrations/connectors');
    return data.data;
  }

  /**
   * Get all integration connections for the current organization
   */
  async getConnections(): Promise<IntegrationConnection[]> {
    const { data } = await api.get<{ data: ApiIntegrationConnectionResponse[] }>(
      '/api/integrations/connections'
    );
    return data.data.map(transformConnection);
  }

  /**
   * Get a single connection by ID
   */
  async getConnection(connectionId: string): Promise<IntegrationConnection> {
    const { data } = await api.get<{ data: ApiIntegrationConnectionResponse }>(
      `/api/integrations/connections/${connectionId}`
    );
    return transformConnection(data.data);
  }

  /**
   * Create a new integration connection
   */
  async createConnection(request: CreateConnectionRequest): Promise<IntegrationConnection> {
    const payload = {
      connector_type: request.connectorType,
      name: request.name,
      description: request.description,
      config: request.config,
      temp_connection_id: request.tempConnectionId,
    };
    const { data } = await api.post<{ data: ApiIntegrationConnectionResponse }>(
      '/api/integrations/connections',
      payload
    );
    return transformConnection(data.data);
  }

  /**
   * Update an existing connection
   */
  async updateConnection(
    connectionId: string,
    request: UpdateConnectionRequest
  ): Promise<IntegrationConnection> {
    const payload: Record<string, any> = {};
    if (request.name !== undefined) payload.name = request.name;
    if (request.description !== undefined) payload.description = request.description;
    if (request.config !== undefined) payload.config = request.config;

    const { data } = await api.put<{ data: ApiIntegrationConnectionResponse }>(
      `/api/integrations/connections/${connectionId}`,
      payload
    );
    return transformConnection(data.data);
  }

  /**
   * Delete an integration connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    await api.delete(`/api/integrations/connections/${connectionId}`);
  }

  /**
   * Initiate Google OAuth flow — returns the authorization URL for the popup
   */
  async initiateGoogleOAuth(): Promise<string> {
    const { data } = await api.get<{ data: { authorization_url: string } }>(
      '/api/integrations/google/authorize'
    );
    return data.data.authorization_url;
  }

  /**
   * Reconnect an existing integration connection with fresh OAuth tokens
   */
  async reconnectConnection(connectionId: string, tempConnectionId: string): Promise<IntegrationConnection> {
    const { data } = await api.post<{ data: ApiIntegrationConnectionResponse }>(
      `/api/integrations/connections/${connectionId}/reconnect`,
      { temp_connection_id: tempConnectionId }
    );
    return transformConnection(data.data);
  }

  /**
   * Test an integration connection
   */
  async testConnection(connectionId: string): Promise<TestConnectionResult> {
    const { data } = await api.post<{ data: TestConnectionResult }>(
      `/api/integrations/connections/${connectionId}/test`
    );
    return data.data;
  }

  /**
   * Get spreadsheet metadata (tabs + column headers) for a connection
   */
  async getSheetMetadata(connectionId: string): Promise<SheetMetadataResponse> {
    const { data } = await api.get<{ data: SheetMetadataResponse }>(
      `/api/integrations/connections/${connectionId}/sheets`
    );
    return data.data;
  }
}

export const integrationService = new IntegrationService();
