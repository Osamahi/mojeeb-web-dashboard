/**
 * Action types and interfaces for the Actions feature
 * Frontend uses camelCase, backend uses snake_case (transformation in service layer)
 */

// Action types supported by the system
// Matches backend ActionTypeValidator.ValidTypes — keep in sync.
export type ActionType = 'api_call' | 'webhook' | 'integration';

/**
 * Frontend model (camelCase)
 */
export interface Action {
  id: string;
  agentId: string;
  name: string;
  description: string | null;
  triggerPrompt: string;
  actionType: ActionType;
  actionConfig: Record<string, any>;
  requestExample: Record<string, any> | null;
  testData: Record<string, any> | null;
  isActive: boolean;
  priority: number;
  integrationConnectionId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Backend API response (snake_case)
 */
export interface ApiActionResponse {
  id: string;
  agent_id: string;
  name: string;
  description: string | null;
  trigger_prompt: string;
  action_type: ActionType;
  action_config: Record<string, any>;
  request_example: Record<string, any> | null;
  test_data: Record<string, any> | null;
  is_active: boolean;
  priority: number;
  integration_connection_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create action request (frontend → backend)
 */
export interface CreateActionRequest {
  agentId: string;
  name: string;
  description: string;
  triggerPrompt: string;
  actionType: ActionType;
  actionConfig: Record<string, any>;
  requestExample?: Record<string, any>;
  testData?: Record<string, any>;
  isActive: boolean;
  priority: number;
  integrationConnectionId?: string;
}

/**
 * Update action request (frontend → backend)
 */
export interface UpdateActionRequest {
  name?: string;
  description?: string;
  triggerPrompt?: string;
  actionType?: ActionType;
  actionConfig?: Record<string, any>;
  requestExample?: Record<string, any>;
  testData?: Record<string, any>;
  isActive?: boolean;
  priority?: number;
  integrationConnectionId?: string;
}

/**
 * Filter options for actions list
 */
export interface ActionFilters {
  actionType?: ActionType;
  isActive?: boolean;
  search?: string;
}

/**
 * Cursor-paginated response from backend
 */
export interface CursorPaginatedActionsResponse {
  items: ApiActionResponse[];
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * Action execution history item (frontend)
 */
export interface ActionExecution {
  id: string;
  actionId: string;
  actionName?: string | null;
  actionType?: string | null;
  agentName?: string | null;
  conversationId: string | null;
  status: 'success' | 'failed' | 'pending';
  executedAt: string;
  executionTimeMs: number | null;
  errorMessage: string | null;
  requestData: Record<string, any> | null;
  responseData: Record<string, any> | null;
}

/**
 * Action execution history item (backend API response)
 */
export interface ApiActionExecutionResponse {
  id: string;
  action_id: string;
  action_name?: string | null;
  action_type?: string | null;
  agent_name?: string | null;
  conversation_id: string | null;
  status: 'success' | 'failed' | 'pending';
  executed_at: string;
  execution_time_ms: number | null;
  error_message: string | null;
  request_data: Record<string, any> | null;
  response_data: Record<string, any> | null;
}

/**
 * Cursor-paginated executions response from backend
 */
export interface CursorPaginatedExecutionsResponse {
  items: ApiActionExecutionResponse[];
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * Filters for global executions list
 */
export interface ExecutionFilters {
  status?: string;
  actionType?: string;
  search?: string;
}

/**
 * Action execution history response
 */
export interface ActionExecutionHistoryResponse {
  action: {
    id: string;
    name: string;
    type: ActionType;
    isActive: boolean;
  };
  executions: ActionExecution[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    avgExecutionTime: number;
  };
}
