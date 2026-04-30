/**
 * TanStack Query hooks for API keys.
 *
 * Centralised cache key (`apiKeysQueryKey`) so mutations can invalidate the
 * list without each caller having to remember the key shape.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiKeysService } from '../services/apiKeysService';
import type {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  RevokeApiKeyRequest,
  UpdateApiKeyRequest,
} from '../types/apiKey.types';

export const apiKeysQueryKey = ['api-keys'] as const;

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: apiKeysQueryKey,
    queryFn: () => apiKeysService.list(),
    staleTime: 30_000,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation<CreateApiKeyResponse, unknown, CreateApiKeyRequest>({
    mutationFn: (request) => apiKeysService.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKey });
    },
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();
  return useMutation<ApiKey, unknown, { id: string; request: UpdateApiKeyRequest }>({
    mutationFn: ({ id, request }) => apiKeysService.update(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKey });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, { id: string; request?: RevokeApiKeyRequest }>({
    mutationFn: ({ id, request }) => apiKeysService.revoke(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKey });
    },
  });
}
