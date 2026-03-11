/**
 * Integration types and interfaces
 * Frontend uses camelCase, backend uses snake_case (transformation in service layer)
 */

// Supported connector types
export type ConnectorType = 'google_sheets';

// Connection status
export type ConnectionStatus = 'active' | 'error' | 'disconnected';

/**
 * Frontend model (camelCase)
 */
export interface IntegrationConnection {
  id: string;
  organizationId: string;
  connectorType: ConnectorType;
  name: string;
  description: string | null;
  config: Record<string, any>;
  isConnected: boolean;
  isTokenExpired: boolean;
  tokenExpiresAt: string | null;
  status: ConnectionStatus;
  lastTestedAt: string | null;
  lastError: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Backend API response (snake_case)
 */
export interface ApiIntegrationConnectionResponse {
  id: string;
  organization_id: string;
  connector_type: ConnectorType;
  name: string;
  description: string | null;
  config: Record<string, any>;
  is_connected: boolean;
  is_token_expired: boolean;
  token_expires_at: string | null;
  status: ConnectionStatus;
  last_tested_at: string | null;
  last_error: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create connection request
 */
export interface CreateConnectionRequest {
  connectorType: ConnectorType;
  name: string;
  description?: string;
  config: Record<string, any>;
  tempConnectionId: string;
}

/**
 * Update connection request
 */
export interface UpdateConnectionRequest {
  name?: string;
  description?: string;
  config?: Record<string, any>;
}

/**
 * Test connection result
 */
export interface TestConnectionResult {
  success: boolean;
  message: string | null;
  error: string | null;
  metadata: Record<string, any> | null;
}

/**
 * Connector type info from backend
 */
export interface ConnectorInfo {
  type: ConnectorType;
  label: string;
}

/**
 * Sheet tab info with column headers
 */
export interface SheetTabInfo {
  name: string;
  headers: string[];
}

/**
 * Spreadsheet metadata response
 */
export interface SheetMetadataResponse {
  spreadsheet_title: string;
  tabs: SheetTabInfo[];
}

/**
 * Column mapping entry for integration actions
 */
export interface ColumnMappingEntry {
  source: 'variable' | 'auto_increment' | 'timestamp' | 'static';
  header?: string;
  variable_name?: string;
  prefix?: string;
  format?: string;
  value?: string;
  default?: string;
  enabled: boolean;
}
