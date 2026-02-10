/**
 * React Query hooks for fetching actions
 * Uses infinite scroll with cursor pagination
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { actionService } from '../services/actionService';
import type { ActionFilters } from '../types';
import { useAgentContext } from '@/hooks/useAgentContext';

/**
 * Infinite scroll hook for actions list (specific agent)
 */
export function useInfiniteActions(filters?: ActionFilters) {
  const { agentId } = useAgentContext();

  return useInfiniteQuery({
    queryKey: ['actions', agentId, 'infinite-cursor', filters],
    queryFn: ({ pageParam }) =>
      actionService.getActionsCursor(agentId!, 50, pageParam, filters),
    enabled: !!agentId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    select: (data) => ({
      actions: data.pages.flatMap((page) => page.actions),
      hasMore: data.pages[data.pages.length - 1]?.hasMore ?? false,
    }),
  });
}

/**
 * Infinite scroll hook for ALL actions (SuperAdmin only)
 */
export function useInfiniteAllActions(filters?: ActionFilters & { agentId?: string }) {
  return useInfiniteQuery({
    queryKey: ['actions', 'all', 'infinite-cursor', filters],
    queryFn: ({ pageParam }) =>
      actionService.getAllActionsCursor(50, pageParam, filters),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    select: (data) => ({
      actions: data.pages.flatMap((page) => page.actions),
      hasMore: data.pages[data.pages.length - 1]?.hasMore ?? false,
    }),
  });
}

/**
 * Single action hook
 */
export function useAction(actionId: string | undefined) {
  const { agentId } = useAgentContext();

  return useQuery({
    queryKey: ['actions', agentId, actionId],
    queryFn: () => actionService.getAction(actionId!, agentId!),
    enabled: !!actionId && !!agentId,
  });
}

/**
 * Action execution history hook
 */
export function useActionExecutions(actionId: string | undefined, limit: number = 50) {
  const { agentId } = useAgentContext();

  return useQuery({
    queryKey: ['actions', agentId, actionId, 'executions', limit],
    queryFn: () => actionService.getExecutionHistory(actionId!, agentId!, limit),
    enabled: !!actionId && !!agentId,
  });
}
