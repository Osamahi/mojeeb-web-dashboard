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
 * Create connection request. The OAuth session ID is returned by
 * `POST /api/integrations/google/oauth-sessions` after the browser-side GIS
 * auth-code flow completes.
 */
export interface CreateConnectionRequest {
  connectorType: ConnectorType;
  name: string;
  description?: string;
  config: Record<string, any>;
  oauthSessionId: string;
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
 * Sheet tab info with column headers.
 *
 * `sheet_id` is the numeric `gid` Google assigns to each tab — stable for the life of the
 * tab (survives renames; only changes if the tab is deleted and recreated). Captured here
 * so action setup can store it on `action_config.target_sheet_id`, which the backend
 * requires for verbs like `add_row` / `update_row` that attach developer metadata to rows
 * (developer metadata locations require `sheetId`, not the tab name).
 */
export interface SheetTabInfo {
  name: string;
  sheet_id: number;
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
