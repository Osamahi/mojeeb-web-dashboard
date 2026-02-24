export type FollowUpJobStatus = 'scheduled' | 'processing' | 'sent' | 'skipped' | 'cancelled' | 'failed';

export interface FollowUpJob {
  id: string;
  conversationId: string;
  agentId: string;
  agentName: string;
  stepOrder: number;
  stepDelayMinutes: number;
  status: FollowUpJobStatus;
  source: string;
  customerName: string | null;
  scheduledFor: string;
  sentAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  skippedReason: string | null;
  lastError: string | null;
  generatedMessage: string | null;
  attemptCount: number;
  createdAt: string;
}

export interface FollowUpJobFilters {
  status?: FollowUpJobStatus;
  agentId?: string;
  platform?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** Raw API response matching CursorPaginatedResponse<T> (snake_case from Newtonsoft.Json) */
export interface AdminFollowUpJobsApiResponse {
  items: ApiFollowUpJob[];
  next_cursor: string | null;
  has_more: boolean;
}

/** Raw API response shape (snake_case) */
export interface ApiFollowUpJob {
  id: string;
  conversation_id: string;
  agent_id: string;
  agent_name: string;
  step_order: number;
  step_delay_minutes: number;
  status: FollowUpJobStatus;
  source: string;
  customer_name: string | null;
  scheduled_for: string;
  sent_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  skipped_reason: string | null;
  last_error: string | null;
  generated_message: string | null;
  attempt_count: number;
  created_at: string;
}
