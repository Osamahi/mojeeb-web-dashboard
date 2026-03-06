/**
 * Failed message types
 * Maps to ai_response_errors table via backend FailedMessagesController
 */

/** Frontend model (camelCase) */
export interface FailedMessage {
  id: string;
  conversationId: string;
  agentId: string;
  organizationId: string;
  errorType: string;
  errorReason: string;
  rawResponse: string | null;
  parsingMethod: string | null;
  platform: string | null;
  createdAt: string;
}

/** Backend API response (snake_case) */
export interface ApiFailedMessageResponse {
  id: string;
  conversation_id: string;
  agent_id: string;
  organization_id: string;
  error_type: string;
  error_reason: string;
  raw_response: string | null;
  parsing_method: string | null;
  platform: string | null;
  created_at: string;
}

/** Cursor-paginated response from backend */
export interface CursorPaginatedFailedMessagesResponse {
  items: ApiFailedMessageResponse[];
  next_cursor: string | null;
  has_more: boolean;
}

/** Filter options for failed messages */
export interface FailedMessageFilters {
  errorType?: string;
  platform?: string;
  agentId?: string;
  search?: string;
}
