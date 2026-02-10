/**
 * Action service for API communication
 * Handles snake_case (backend) ↔ camelCase (frontend) transformation
 */

import api from '@/lib/api';
import type {
  Action,
  ApiActionResponse,
  CreateActionRequest,
  UpdateActionRequest,
  ActionFilters,
  CursorPaginatedActionsResponse,
  ActionExecution,
  ApiActionExecutionResponse,
  ActionExecutionHistoryResponse,
} from '../types';

/**
 * Transform snake_case API response to camelCase frontend model
 */
function transformAction(apiAction: ApiActionResponse): Action {
  // Debug logging for date investigation
  if (!apiAction.created_at || !apiAction.updated_at) {
    console.warn('[ActionService] Missing date fields:', {
      id: apiAction.id,
      name: apiAction.name,
      created_at: apiAction.created_at,
      updated_at: apiAction.updated_at,
      fullObject: apiAction,
    });
  }

  return {
    id: apiAction.id,
    agentId: apiAction.agent_id,
    name: apiAction.name,
    description: apiAction.description,
    triggerPrompt: apiAction.trigger_prompt,
    actionType: apiAction.action_type,
    actionConfig: apiAction.action_config,
    requestExample: apiAction.request_example,
    responseExample: apiAction.response_example,
    responseMapping: apiAction.response_mapping,
    testData: apiAction.test_data,
    sandboxOptions: apiAction.sandbox_options,
    isActive: apiAction.is_active,
    priority: apiAction.priority,
    createdAt: apiAction.created_at || new Date().toISOString(),
    updatedAt: apiAction.updated_at || new Date().toISOString(),
  };
}

/**
 * Transform camelCase frontend request to snake_case backend request
 */
function transformCreateRequest(request: CreateActionRequest): Record<string, any> {
  return {
    agent_id: request.agentId,
    name: request.name,
    description: request.description,
    trigger_prompt: request.triggerPrompt,
    action_type: request.actionType,
    action_config: request.actionConfig,
    request_example: request.requestExample,
    response_example: request.responseExample,
    response_mapping: request.responseMapping,
    test_data: request.testData,
    sandbox_options: request.sandboxOptions,
    is_active: request.isActive,
    priority: request.priority,
  };
}

/**
 * Transform camelCase update request to snake_case backend request
 */
function transformUpdateRequest(request: UpdateActionRequest): Record<string, any> {
  const transformed: Record<string, any> = {};

  if (request.name !== undefined) transformed.name = request.name;
  if (request.description !== undefined) transformed.description = request.description;
  if (request.triggerPrompt !== undefined) transformed.trigger_prompt = request.triggerPrompt;
  if (request.actionType !== undefined) transformed.action_type = request.actionType;
  if (request.actionConfig !== undefined) transformed.action_config = request.actionConfig;
  if (request.requestExample !== undefined) transformed.request_example = request.requestExample;
  if (request.responseExample !== undefined) transformed.response_example = request.responseExample;
  if (request.responseMapping !== undefined) transformed.response_mapping = request.responseMapping;
  if (request.testData !== undefined) transformed.test_data = request.testData;
  if (request.sandboxOptions !== undefined) transformed.sandbox_options = request.sandboxOptions;
  if (request.isActive !== undefined) transformed.is_active = request.isActive;
  if (request.priority !== undefined) transformed.priority = request.priority;

  return transformed;
}

/**
 * Transform action execution response
 */
function transformActionExecution(apiExecution: ApiActionExecutionResponse): ActionExecution {
  return {
    id: apiExecution.id,
    actionId: apiExecution.action_id,
    conversationId: apiExecution.conversation_id,
    status: apiExecution.status,
    executedAt: apiExecution.executed_at,
    executionTimeMs: apiExecution.execution_time_ms,
    errorMessage: apiExecution.error_message,
    requestData: apiExecution.request_data,
    responseData: apiExecution.response_data,
  };
}

class ActionService {
  /**
   * Get actions with cursor pagination for a specific agent
   */
  async getActionsCursor(
    agentId: string,
    limit: number = 50,
    cursor?: string,
    filters?: ActionFilters
  ): Promise<{ actions: Action[]; nextCursor: string | null; hasMore: boolean }> {
    const params = new URLSearchParams();
    params.append('agentId', agentId);
    params.append('limit', limit.toString());

    if (cursor) {
      params.append('cursor', cursor);
    }

    if (filters?.actionType) {
      params.append('actionType', filters.actionType);
    }

    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    const url = `/api/actions?${params.toString()}`;
    const { data } = await api.get<{ data: CursorPaginatedActionsResponse }>(url);

    return {
      actions: data.data.items.map(transformAction),
      nextCursor: data.data.next_cursor,
      hasMore: data.data.has_more,
    };
  }

  /**
   * Get ALL actions across all agents (SuperAdmin only)
   */
  async getAllActionsCursor(
    limit: number = 50,
    cursor?: string,
    filters?: ActionFilters & { agentId?: string }
  ): Promise<{ actions: Action[]; nextCursor: string | null; hasMore: boolean }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    if (cursor) {
      params.append('cursor', cursor);
    }

    if (filters?.agentId) {
      params.append('agentId', filters.agentId);
    }

    if (filters?.actionType) {
      params.append('actionType', filters.actionType);
    }

    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    const url = `/api/actions/all?${params.toString()}`;
    const { data } = await api.get<{ data: CursorPaginatedActionsResponse }>(url);

    return {
      actions: data.data.items.map(transformAction),
      nextCursor: data.data.next_cursor,
      hasMore: data.data.has_more,
    };
  }

  /**
   * Get a single action by ID
   */
  async getAction(actionId: string, agentId: string): Promise<Action> {
    const { data } = await api.get<{ data: ApiActionResponse }>(
      `/api/actions/${actionId}?agentId=${agentId}`
    );
    return transformAction(data.data);
  }

  /**
   * Create a new action
   */
  async createAction(request: CreateActionRequest): Promise<Action> {
    const payload = transformCreateRequest(request);
    const { data } = await api.post<{ data: ApiActionResponse }>('/api/actions', payload);
    return transformAction(data.data);
  }

  /**
   * Update an existing action
   */
  async updateAction(
    actionId: string,
    agentId: string,
    request: UpdateActionRequest
  ): Promise<Action> {
    const payload = transformUpdateRequest(request);
    const { data } = await api.put<{ data: ApiActionResponse }>(
      `/api/actions/${actionId}?agentId=${agentId}`,
      payload
    );
    return transformAction(data.data);
  }

  /**
   * Delete an action
   */
  async deleteAction(actionId: string, agentId: string): Promise<void> {
    await api.delete(`/api/actions/${actionId}?agentId=${agentId}`);
  }

  /**
   * Get execution history for an action
   */
  async getExecutionHistory(
    actionId: string,
    agentId: string,
    limit: number = 50
  ): Promise<ActionExecutionHistoryResponse> {
    const { data } = await api.get<{ data: any }>(
      `/api/actions/${actionId}/executions?agentId=${agentId}&limit=${limit}`
    );

    return {
      action: {
        id: data.data.action.id,
        name: data.data.action.name,
        type: data.data.action.type,
        isActive: data.data.action.isActive || data.data.action.is_active,
      },
      executions: data.data.executions.map(transformActionExecution),
      stats: {
        total: data.data.stats.total,
        successful: data.data.stats.successful,
        failed: data.data.stats.failed,
        avgExecutionTime: data.data.stats.avgExecutionTime || data.data.stats.avg_execution_time,
      },
    };
  }
}

export const actionService = new ActionService();
