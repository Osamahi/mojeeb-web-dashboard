/**
 * API Keys service — calls the dashboard's /api/api-keys endpoints.
 * Uses snake_case bodies (backend uses Newtonsoft + SnakeCaseNamingStrategy
 * per CLAUDE.md), so request keys are already snake_case in the types.
 */

import api from '@/lib/api';
import type {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  RevokeApiKeyRequest,
  UpdateApiKeyRequest,
} from '../types/apiKey.types';

class ApiKeysService {
  private readonly base = '/api/api-keys';

  async list(): Promise<ApiKey[]> {
    const response = await api.get<{ items: ApiKey[] }>(this.base);
    return response.data.items ?? [];
  }

  async getById(id: string): Promise<ApiKey> {
    const response = await api.get<ApiKey>(`${this.base}/${id}`);
    return response.data;
  }

  async create(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    const response = await api.post<CreateApiKeyResponse>(this.base, request);
    return response.data;
  }

  async update(id: string, request: UpdateApiKeyRequest): Promise<ApiKey> {
    const response = await api.patch<ApiKey>(`${this.base}/${id}`, request);
    return response.data;
  }

  async revoke(id: string, request?: RevokeApiKeyRequest): Promise<void> {
    await api.delete(`${this.base}/${id}`, { data: request ?? {} });
  }
}

export const apiKeysService = new ApiKeysService();
