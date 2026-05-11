/**
 * React Query hooks for integration connections.
 * Uses isToastHandled to avoid duplicate toasts when the centralized Axios interceptor
 * has already shown a 403 permission-denied toast (per CLAUDE.md pattern).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { integrationService } from '../services/integrationService';
import type { CreateConnectionRequest, IntegrationConnection } from '../types';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { isToastHandled } from '@/lib/errors';

/**
 * Pull a user-facing error message from a thrown axios error. Falls back to the
 * caller-supplied i18n string if the backend didn't return a message.
 *
 * The server-supplied message comes from `error.response.data.message` and is
 * intentionally NOT translated here — backend messages today are English-only,
 * and showing a backend-English error inline beside Arabic UI is the lesser
 * evil compared to silently swallowing the actual reason a request failed.
 * When the backend gains i18n support this fallback can drop in cleanly.
 */
function serverMessage(error: unknown, fallback: string): string {
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
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (request: CreateConnectionRequest) =>
      integrationService.createConnection(request),
    onSuccess: () => {
      toast.success(t('tools.toast_connection_created'));
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: (error) => {
      if (!isToastHandled(error)) {
        toast.error(serverMessage(error, t('tools.toast_create_failed')));
      }
    },
  });
}

export function useReconnectConnection() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ connectionId, oauthSessionId }: { connectionId: string; oauthSessionId: string }) =>
      integrationService.reconnectConnection(connectionId, oauthSessionId),
    onSuccess: () => {
      toast.success(t('tools.toast_connection_reconnected'));
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: (error) => {
      if (!isToastHandled(error)) {
        toast.error(serverMessage(error, t('tools.toast_reconnect_failed')));
      }
    },
  });
}

/**
 * Delete an integration connection.
 *
 * @param options.silent — suppress the success toast. Useful when the deletion
 *   happens as part of a larger cancel/cleanup flow (e.g. user discards mid-
 *   Create wizard) where a "successfully deleted" celebration would feel
 *   off-tone. Errors still toast either way.
 */
export function useDeleteConnection(options?: { silent?: boolean }) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const silent = options?.silent ?? false;

  return useMutation({
    mutationFn: (connectionId: string) =>
      integrationService.deleteConnection(connectionId),
    onSuccess: (_data, connectionId) => {
      if (!silent) toast.success(t('tools.toast_connection_deleted'));

      // Splice the deleted connection out of the cached list immediately so the
      // UI reflects the deletion without waiting for the refetch. Pure
      // invalidation alone is enough in theory (TanStack Query refetches
      // mounted observers on invalidate), but in practice the refetch can race
      // with React's render cycle and leave the deleted card on screen for a
      // beat — which the user was hitting and reading as "I have to restart".
      // Optimistic-on-success removes that beat entirely.
      queryClient.setQueryData<IntegrationConnection[]>(
        queryKeys.integrationConnections(),
        (old) => old?.filter((c) => c.id !== connectionId) ?? []
      );

      // Still invalidate so the next mount/focus reconciles against the server.
      // Belt-and-suspenders: if the optimistic splice and the server view ever
      // diverge (e.g. another tab created a new connection), this catches it.
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: (error) => {
      if (!isToastHandled(error)) {
        toast.error(serverMessage(error, t('tools.toast_delete_failed')));
      }
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
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (connectionId: string) =>
      integrationService.testConnection(connectionId),
    onSuccess: (result) => {
      // result.message / result.error come from the backend (English today).
      // We use them when present so connection-specific failure reasons reach
      // the user; fall back to a translated generic when the backend was terse.
      if (result.success) {
        toast.success(result.message || t('tools.toast_test_success'));
      } else {
        toast.error(result.error || t('tools.toast_test_failed'));
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections() });
    },
    onError: (error) => {
      if (!isToastHandled(error)) {
        toast.error(serverMessage(error, t('tools.toast_test_failed')));
      }
    },
  });
}
