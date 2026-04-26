/**
 * Saved Messages — API service
 * snake_case (wire) <-> camelCase (frontend) transformation.
 */

import api from '@/lib/api';
import type {
  ApiSavedMessage,
  CreateSavedMessageRequest,
  SavedMessage,
  UpdateSavedMessageRequest,
} from '../types/savedMessages.types';

interface ApiResponseEnvelope<T> {
  data: T;
  timestamp?: string;
  // Some controllers also include success/message fields.
  success?: boolean;
  message?: string | null;
}

const transform = (api: ApiSavedMessage): SavedMessage => ({
  id: api.id,
  agentId: api.agent_id,
  title: api.title,
  shortcut: api.shortcut,
  content: api.content,
  sortOrder: api.sort_order,
  isActive: api.is_active,
  createdAt: api.created_at,
  updatedAt: api.updated_at,
});

class SavedMessagesService {
  async list(agentId: string, includeInactive = false): Promise<SavedMessage[]> {
    const { data } = await api.get<ApiResponseEnvelope<ApiSavedMessage[]>>(
      `/api/agents/${agentId}/saved-messages`,
      { params: { includeInactive } }
    );
    return (data.data ?? []).map(transform);
  }

  async create(agentId: string, payload: CreateSavedMessageRequest): Promise<SavedMessage> {
    const { data } = await api.post<ApiResponseEnvelope<ApiSavedMessage>>(
      `/api/agents/${agentId}/saved-messages`,
      payload
    );
    return transform(data.data);
  }

  async update(
    agentId: string,
    id: string,
    payload: UpdateSavedMessageRequest
  ): Promise<SavedMessage> {
    const { data } = await api.put<ApiResponseEnvelope<ApiSavedMessage>>(
      `/api/agents/${agentId}/saved-messages/${id}`,
      payload
    );
    return transform(data.data);
  }

  async remove(agentId: string, id: string): Promise<void> {
    await api.delete(`/api/agents/${agentId}/saved-messages/${id}`);
  }
}

export const savedMessagesService = new SavedMessagesService();
