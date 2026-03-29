import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      toast.error(t('connections.disconnect_error_toast'));
    },
    onSuccess: () => {
      toast.success(t('connections.disconnect_success_toast'));
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.connections(agentId) });
    },
  });
}

/**
 * Mutation hook for toggling AI response on a connection.
 * Uses optimistic updates with rollback on error.
 */
export function useToggleAIResponse() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  const mutation = useMutation({
    mutationFn: ({ connectionId, respondToMessages }: { connectionId: string; respondToMessages: boolean }) =>
      connectionService.updateConnectionSettings(connectionId, { respond_to_messages: respondToMessages }),
    onMutate: async ({ connectionId, respondToMessages }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.connections(agentId) });

      const previousConnections = queryClient.getQueryData<PlatformConnection[]>(
        queryKeys.connections(agentId)
      );

      if (previousConnections) {
        queryClient.setQueryData<PlatformConnection[]>(queryKeys.connections(agentId), old =>
          old?.map(conn =>
            conn.id === connectionId ? { ...conn, respondToMessages } : conn
          )
        );
      }

      return { previousConnections };
    },
    onSuccess: (_data, { respondToMessages }) => {
      toast.success(respondToMessages ? t('connections.ai_activated_toast') : t('connections.ai_deactivated_toast'));
    },
    onError: (_error, _variables, context) => {
      if (context?.previousConnections) {
        queryClient.setQueryData(queryKeys.connections(agentId), context.previousConnections);
      }
      toast.error(t('connections.ai_toggle_error_toast'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections(agentId) });
    },
  });

  const toggleAIResponse = useCallback(
    (connection: PlatformConnection, enabled: boolean) => {
      mutation.mutate({ connectionId: connection.id, respondToMessages: enabled });
    },
    [mutation]
  );

  return { toggleAIResponse, isPending: mutation.isPending };
}

/**
 * Mutation hook for toggling connection settings (messages or comments).
 * Uses optimistic updates with rollback on error.
 */
export function useToggleConnectionSetting() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  const mutation = useMutation({
    mutationFn: ({ connectionId, setting, enabled }: {
      connectionId: string;
      setting: 'respond_to_messages' | 'respond_to_comments';
      enabled: boolean;
    }) =>
      connectionService.updateConnectionSettings(connectionId, { [setting]: enabled }),
    onMutate: async ({ connectionId, setting, enabled }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.connections(agentId) });

      const previousConnections = queryClient.getQueryData<PlatformConnection[]>(
        queryKeys.connections(agentId)
      );

      if (previousConnections) {
        const field = setting === 'respond_to_messages' ? 'respondToMessages' : 'respondToComments';
        queryClient.setQueryData<PlatformConnection[]>(queryKeys.connections(agentId), old =>
          old?.map(conn =>
            conn.id === connectionId ? { ...conn, [field]: enabled } : conn
          )
        );
      }

      return { previousConnections };
    },
    onSuccess: (_data, { setting, enabled }) => {
      if (setting === 'respond_to_messages') {
        toast.success(enabled ? t('connections.messages_on') : t('connections.messages_off'));
      } else {
        toast.success(enabled ? t('connections.comments_on') : t('connections.comments_off'));
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousConnections) {
        queryClient.setQueryData(queryKeys.connections(agentId), context.previousConnections);
      }
      toast.error(t('connections.ai_toggle_error_toast'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections(agentId) });
    },
  });

  const toggleSetting = useCallback(
    (connection: PlatformConnection, setting: 'respond_to_messages' | 'respond_to_comments', enabled: boolean) => {
      mutation.mutate({ connectionId: connection.id, setting, enabled });
    },
    [mutation]
  );

  return { toggleSetting, isPending: mutation.isPending };
}

