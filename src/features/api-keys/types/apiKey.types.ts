/**
 * Public API key types.
 * Mirrors the backend ApiKeyResponse / CreateApiKeyResponse DTOs.
 */

export interface ApiKey {
  id: string;
  name: string;
  /** "mk_live_8aB3cD" — display only. */
  key_prefix: string;
  /** "e4f5" — last 4 chars for display. */
  key_last_four: string;
  scopes: string[];
  /** null = key may act on all org agents. */
  agent_ids: string[] | null;
  environment: 'live' | 'test';
  rate_limit_per_minute: number | null;
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApiKeyResponse {
  /** The full plain key — show ONCE, never retrievable again. */
  plain_key: string;
  api_key: ApiKey;
}

export interface CreateApiKeyRequest {
  name: string;
  scopes: string[];
  agent_ids?: string[];
  expires_at?: string;
  rate_limit_per_minute?: number;
}

export interface UpdateApiKeyRequest {
  name?: string;
  scopes?: string[];
  agent_ids?: string[];
  clear_agent_ids?: boolean;
  expires_at?: string;
  clear_expires_at?: boolean;
  rate_limit_per_minute?: number;
  clear_rate_limit?: boolean;
}

export interface RevokeApiKeyRequest {
  reason?: string;
}

/** Display helper: combines prefix + last_four into "mk_live_8aB3cD…e4f5". */
export function formatApiKeyDisplay(key: Pick<ApiKey, 'key_prefix' | 'key_last_four'>): string {
  return `${key.key_prefix}…${key.key_last_four}`;
}
