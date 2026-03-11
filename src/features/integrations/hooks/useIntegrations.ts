/**
 * React Query hooks for integration connections
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationService } from '../services/integrationService';
import type { CreateConnectionRequest, UpdateConnectionRequest } from '../types';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Fetch all integration connections for the current organization
 */
export function useIntegrationConnections() {
  return useQuery({
    queryKey: queryKeys.integrationConnections(),
    queryFn: () => integrationService.getConnections(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch available connector types
 */
export function useConnectorTypes() {
  return useQuery({
    queryKey: ['connector-types'],
    queryFn: () => integrationService.getConnectorTypes(),
    staleTime: 30 * 60 * 1000, // rarely changes
  });
}

/**
 * Initiate Google OAuth authorization — returns the authorization URL
 */
export function useInitiateGoogleOAuth() {
  return useMutation({
    mutationFn: () => integrationService.initiateGoogleOAuth(),
    onError: () => {
      toast.error('Failed to initiate Google authorization');
    },
  });
}

/**
 * Create a new integration connection
 */
export function useCreateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateConnectionRequest) =>
      integrationService.createConnection(request),
    onSuccess: () => {
      toast.success('Connection created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: () => {
      toast.error('Failed to create connection');
    },
  });
}

/**
 * Update an existing integration connection
 */
export function useUpdateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateConnectionRequest }) =>
      integrationService.updateConnection(id, request),
    onSuccess: () => {
      toast.success('Connection updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: () => {
      toast.error('Failed to update connection');
    },
  });
}

/**
 * Delete an integration connection
 */
export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      integrationService.deleteConnection(connectionId),
    onSuccess: () => {
      toast.success('Connection deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: () => {
      toast.error('Failed to delete connection');
    },
  });
}

/**
 * Fetch spreadsheet metadata (tabs + column headers) for a connection
 */
export function useSheetMetadata(connectionId: string | null) {
  return useQuery({
    queryKey: ['sheet-metadata', connectionId],
    queryFn: () => integrationService.getSheetMetadata(connectionId!),
    enabled: !!connectionId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Test an integration connection
 */
export function useTestConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      integrationService.testConnection(connectionId),
    onSuccess: (result, connectionId) => {
      if (result.success) {
        toast.success(result.message || 'Connection test successful');
      } else {
        toast.error(result.error || 'Connection test failed');
      }
      // Refresh connections to reflect updated status
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: () => {
      toast.error('Failed to test connection');
    },
  });
}
