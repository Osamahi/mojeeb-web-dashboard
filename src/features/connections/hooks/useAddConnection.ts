/**
 * React Query hooks for adding platform connections
 * Handles OAuth flow, page selection, and connection creation
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { connectionService } from '../services/connectionService';
import { useAgentContext } from '@/hooks/useAgentContext';
import type {
  OAuthIntegrationType,
  OAuthInitiationResponse,
  ConnectPageRequest,
  ConnectPageResponse,
  FacebookPagesResponse,
} from '../types';

/**
 * Hook for initiating OAuth flow
 * Returns authorization URL from backend
 */
export function useInitiateOAuth() {
  return useMutation<
    OAuthInitiationResponse,
    Error,
    { agentId: string; platform: OAuthIntegrationType }
  >({
    mutationFn: ({ agentId, platform }) => connectionService.initiateFacebookOAuth(agentId, platform),
    onSuccess: (data) => {
      logger.info('OAuth initiation successful', {
        platform: data.integrationType,
        agentId: data.agentId,
      });
    },
    onError: (error) => {
      logger.error('OAuth initiation failed', { error });
      toast.error(`Failed to start authorization: ${getErrorMessage(error)}`);
    },
  });
}

/**
 * Hook for fetching available Facebook pages after OAuth authorization
 * Enabled only when tempConnectionId is available
 */
export function useFacebookPages(tempConnectionId: string | null) {
  return useQuery<FacebookPagesResponse, Error>({
    queryKey: queryKeys.facebookPages(tempConnectionId),
    queryFn: () => {
      if (!tempConnectionId) {
        throw new Error('No temporary connection ID available');
      }
      return connectionService.fetchAvailablePages(tempConnectionId);
    },
    enabled: !!tempConnectionId,
    staleTime: 10 * 60 * 1000, // 10 minutes - pages don't change often
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook for connecting a selected Facebook page (and optionally Instagram account)
 * Invalidates connections cache on success
 */
export function useConnectPage() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation<ConnectPageResponse, Error, ConnectPageRequest>({
    mutationFn: (request) => connectionService.connectSelectedPage(request),
    onSuccess: (data) => {
      logger.info('Platform connected successfully', {
        connectionId: data.connectionId,
        platform: data.platform,
      });
      toast.success(`${data.platform} connected successfully!`);

      // Invalidate connections cache to trigger refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.connections(agentId),
      });

      // Clear the pages cache as it's no longer needed
      queryClient.removeQueries({
        queryKey: queryKeys.facebookPages(null),
        exact: false,
      });
    },
    onError: (error) => {
      logger.error('Connection failed', { error });
      toast.error(`Connection failed: ${getErrorMessage(error)}`);
    },
  });
}

/**
 * Combined hook for managing the entire OAuth connection flow
 * Provides state and actions for each step of the flow
 */
export function useOAuthConnectionFlow() {
  const initiateOAuth = useInitiateOAuth();
  const connectPage = useConnectPage();

  return {
    // OAuth initiation
    initiateOAuth: initiateOAuth.mutate,
    isInitiating: initiateOAuth.isPending,
    initiationError: initiateOAuth.error,
    initiationData: initiateOAuth.data,
    resetInitiation: initiateOAuth.reset,

    // Page connection
    connectPage: connectPage.mutate,
    connectPageAsync: connectPage.mutateAsync,
    isConnecting: connectPage.isPending,
    connectionError: connectPage.error,
    connectionData: connectPage.data,
    resetConnection: connectPage.reset,

    // Combined loading state
    isLoading: initiateOAuth.isPending || connectPage.isPending,

    // Reset all state
    resetAll: () => {
      initiateOAuth.reset();
      connectPage.reset();
    },
  };
}
