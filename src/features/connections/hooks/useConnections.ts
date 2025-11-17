import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import { isAxiosError } from '@/lib/errors';
import { connectionService } from '../services/connectionService';
import { CACHE_TIMES } from '../constants';
import type { PlatformConnection } from '../types';
import { toast } from 'sonner';

/**
 * React Query hook for fetching platform connections for the currently selected agent.
 *
 * This hook automatically refetches connections when the global agent selection changes,
 * eliminating the need for manual useEffect hooks watching agentId.
 *
 * Features:
 * - Automatic refetch when agent changes (via query key reactivity)
 * - Proper loading and error states
 * - Built-in caching (5-minute stale time)
 * - Only fetches when an agent is selected
 *
 * @returns {UseQueryResult} React Query result object with connections data
 *
 * @example
 * ```tsx
 * function ConnectionsPage() {
 *   const { data: connections, isLoading, error } = useConnections();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <div>
 *       {connections?.map(conn => (
 *         <ConnectionCard key={conn.id} connection={conn} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useConnections() {
  const { agentId } = useAgentContext();

  return useQuery({
    queryKey: queryKeys.connections(agentId),
    queryFn: async () => {
      if (!agentId) {
        throw new Error('No agent selected');
      }
      return connectionService.getConnections(agentId);
    },
    enabled: !!agentId,
    staleTime: CACHE_TIMES.CONNECTIONS,
    retry: (failureCount, error) => {
      // Use proper type guard instead of unsafe type assertion
      if (isAxiosError(error)) {
        const status = error.response?.status;
        // Don't retry on authentication errors (401, 403) or rate limiting (429)
        if (status === 401 || status === 403 || status === 429) {
          return false;
        }
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
}

/**
 * Mutation hook for disconnecting a platform connection.
 *
 * Features:
 * - Optimistic UI updates
 * - Automatic cache invalidation
 * - Error handling with rollback
 * - Success/error toast notifications
 *
 * @example
 * ```tsx
 * function ConnectionCard({ connection }) {
 *   const disconnectMutation = useDisconnectPlatform();
 *
 *   const handleDisconnect = () => {
 *     disconnectMutation.mutate(connection.id);
 *   };
 *
 *   return (
 *     <button
 *       onClick={handleDisconnect}
 *       disabled={disconnectMutation.isPending}
 *     >
 *       Disconnect
 *     </button>
 *   );
 * }
 * ```
 */
export function useDisconnectPlatform() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: (connectionId: string) => connectionService.disconnectPlatform(connectionId),
    onMutate: async (connectionId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.connections(agentId) });

      // Snapshot the previous value
      const previousConnections = queryClient.getQueryData<PlatformConnection[]>(
        queryKeys.connections(agentId)
      );

      // Optimistically update by setting isActive to false
      if (previousConnections) {
        queryClient.setQueryData<PlatformConnection[]>(queryKeys.connections(agentId), old =>
          old?.map(conn => (conn.id === connectionId ? { ...conn, isActive: false } : conn))
        );
      }

      // Return context for rollback
      return { previousConnections };
    },
    onError: (_error, _connectionId, context) => {
      // Rollback on error
      if (context?.previousConnections) {
        queryClient.setQueryData(queryKeys.connections(agentId), context.previousConnections);
      }
      toast.error('Failed to disconnect platform');
    },
    onSuccess: () => {
      toast.success('Platform disconnected successfully');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.connections(agentId) });
    },
  });
}

/**
 * Hook for checking health status of Meta (Facebook/Instagram) connections.
 *
 * @param connectionId - The connection ID to check
 * @returns {UseQueryResult} Query result with health status
 */
export function useConnectionHealth(connectionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.connectionHealth(connectionId),
    queryFn: async () => {
      if (!connectionId) {
        throw new Error('No connection ID provided');
      }
      return connectionService.checkConnectionHealth(connectionId);
    },
    enabled: !!connectionId,
    staleTime: CACHE_TIMES.HEALTH_CHECK,
    retry: false, // Don't retry health checks
  });
}
