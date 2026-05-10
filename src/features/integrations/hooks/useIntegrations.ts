/**
 * React Query hooks for integration connections.
 * Uses isToastHandled to avoid duplicate toasts when the centralized Axios interceptor
 * has already shown a 403 permission-denied toast (per CLAUDE.md pattern).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationService } from '../services/integrationService';
import type { CreateConnectionRequest } from '../types';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { isToastHandled } from '@/lib/errors';

function serverMessage(error: unknown, fallback: string): string {
  // Axios attaches the parsed JSON response body at error.response.data
  const data = (error as { response?: { data?: { message?: string } } })?.response?.data;
  return data?.message ?? fallback;
}

export function useIntegrationConnections() {
  return useQuery({
    queryKey: queryKeys.integrationConnections(),
    queryFn: () => integrationService.getConnections(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateConnectionRequest) =>
      integrationService.createConnection(request),
    onSuccess: () => {
      toast.success('Connection created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: (error) => {
      if (!isToastHandled(error)) toast.error(serverMessage(error, 'Failed to create connection'));
    },
  });
}

export function useReconnectConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ connectionId, oauthSessionId }: { connectionId: string; oauthSessionId: string }) =>
      integrationService.reconnectConnection(connectionId, oauthSessionId),
    onSuccess: () => {
      toast.success('Connection reconnected successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: (error) => {
      if (!isToastHandled(error)) toast.error(serverMessage(error, 'Failed to reconnect connection'));
    },
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      integrationService.deleteConnection(connectionId),
    onSuccess: () => {
      toast.success('Connection deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: (error) => {
      if (!isToastHandled(error)) toast.error(serverMessage(error, 'Failed to delete connection'));
    },
  });
}

/**
 * Connector-specific connection metadata. The endpoint is generic (`/metadata`); the response
 * shape is connector-defined. Today only Sheets is registered, so the type is
 * <c>SheetMetadataResponse</c>; renaming when a 2nd connector lands is part of the
 * Sheets-specific UI split (see R1+R2 in the cleanup plan).
 */
export function useConnectionMetadata(connectionId: string | null) {
  return useQuery({
    queryKey: queryKeys.connectionMetadata(connectionId ?? ''),
    queryFn: () => integrationService.getConnectionMetadata(connectionId!),
    enabled: !!connectionId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTestConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      integrationService.testConnection(connectionId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || 'Connection test successful');
      } else {
        toast.error(result.error || 'Connection test failed');
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: (error) => {
      if (!isToastHandled(error)) toast.error(serverMessage(error, 'Failed to test connection'));
    },
  });
}
