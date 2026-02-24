import api from '@/lib/api';
import type {
  FollowUpJob,
  FollowUpJobFilters,
  AdminFollowUpJobsApiResponse,
  ApiFollowUpJob,
  FollowUpStepAdmin,
  FollowUpStepFilters,
  AdminFollowUpStepsApiResponse,
  ApiFollowUpStepAdmin,
} from '../types/followup.types';

function transformJob(apiJob: ApiFollowUpJob): FollowUpJob {
  return {
    id: apiJob.id,
    conversationId: apiJob.conversation_id,
    agentId: apiJob.agent_id,
    agentName: apiJob.agent_name,
    stepOrder: apiJob.step_order,
    stepDelayMinutes: apiJob.step_delay_minutes,
    status: apiJob.status,
    source: apiJob.source,
    customerName: apiJob.customer_name,
    scheduledFor: apiJob.scheduled_for,
    sentAt: apiJob.sent_at,
    cancelledAt: apiJob.cancelled_at,
    cancelReason: apiJob.cancel_reason,
    skippedReason: apiJob.skipped_reason,
    lastError: apiJob.last_error,
    generatedMessage: apiJob.generated_message,
    attemptCount: apiJob.attempt_count,
    createdAt: apiJob.created_at,
  };
}

function transformStep(apiStep: ApiFollowUpStepAdmin): FollowUpStepAdmin {
  return {
    id: apiStep.id,
    agentId: apiStep.agent_id,
    agentName: apiStep.agent_name,
    stepOrder: apiStep.step_order,
    delayMinutes: apiStep.delay_minutes,
    isEnabled: apiStep.is_enabled,
    createdAt: apiStep.created_at,
    updatedAt: apiStep.updated_at,
  };
}

class FollowUpAdminService {
  /**
   * Fetches follow-up jobs with cursor-based pagination.
   * Matches leads/conversations pattern: { items, nextCursor, hasMore }
   */
  async getJobs(
    filters: FollowUpJobFilters,
    limit: number = 50,
    cursor?: string | null
  ): Promise<{ items: FollowUpJob[]; nextCursor: string | null; hasMore: boolean }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    if (cursor) params.append('cursor', cursor);
    if (filters.status) params.append('status', filters.status);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.platform) params.append('platform', filters.platform);
    if (filters.searchTerm) params.append('search', filters.searchTerm);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    // ExecuteServiceCallAsync wraps in { data: { items, next_cursor, has_more }, timestamp }
    const { data: response } = await api.get<{ data: AdminFollowUpJobsApiResponse }>(
      `/api/admin/followups?${params.toString()}`
    );

    const payload = response.data;

    return {
      items: payload.items.map(transformJob),
      nextCursor: payload.next_cursor,
      hasMore: payload.has_more,
    };
  }
  /**
   * Fetches follow-up steps with cursor-based pagination.
   * Matches getJobs pattern: { items, nextCursor, hasMore }
   */
  async getSteps(
    filters: FollowUpStepFilters,
    limit: number = 50,
    cursor?: string | null
  ): Promise<{ items: FollowUpStepAdmin[]; nextCursor: string | null; hasMore: boolean }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    if (cursor) params.append('cursor', cursor);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.isEnabled) params.append('isEnabled', filters.isEnabled);
    if (filters.searchTerm) params.append('search', filters.searchTerm);

    // ExecuteServiceCallAsync wraps in { data: { items, next_cursor, has_more }, timestamp }
    const { data: response } = await api.get<{ data: AdminFollowUpStepsApiResponse }>(
      `/api/admin/followups/steps?${params.toString()}`
    );

    const payload = response.data;

    return {
      items: payload.items.map(transformStep),
      nextCursor: payload.next_cursor,
      hasMore: payload.has_more,
    };
  }
}

export const followUpAdminService = new FollowUpAdminService();
