/**
 * Saved Messages — types
 * Quick-reply templates an operator can insert into the composer.
 * Plain text only in v1; attachment fields are reserved for v2.
 */

export interface SavedMessage {
  id: string;
  agentId: string;
  title: string;
  shortcut: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Wire format from backend (snake_case)
export interface ApiSavedMessage {
  id: string;
  agent_id: string;
  title: string;
  shortcut: string;
  content: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedMessageRequest {
  title: string;
  shortcut: string;
  content: string;
  sort_order?: number;
}

export interface UpdateSavedMessageRequest {
  title: string;
  shortcut: string;
  content: string;
  sort_order?: number;
  is_active?: boolean;
}
