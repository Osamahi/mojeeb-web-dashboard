import { useInfiniteQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { queryKeys } from '@/lib/queryKeys';
import { agentService } from '../services/agentService';

const PAGE_SIZE = 50; // Matches backend default for /api/agents

/**
 * Filter shape — matches the SQL RPCs (`get_admin_agents` / `get_org_agents`)
 * and the agentService.getAgentsCursor params. Sort is fixed at the cursor's
 * keyset (created_at DESC, id DESC) — no sortBy option.
 */
export interface AgentsFilters {
  searchTerm?: string;
  status?: string;
  modelProvider?: string;
  platformTarget?: string;
  planCode?: string;
}

interface UseInfiniteAgentsOptions extends AgentsFilters {
  /** Page size override. Server clamps to 1..200. */
  limit?: number;
  /** Disable the query (e.g. when no auth context yet). */
  enabled?: boolean;
}

/**
 * Cursor-paginated agents listing.
 *
 * Mirrors useInfiniteConversations / useInfiniteLeads. The single source of
 * truth for "what agents can the current user see?" — the agent store
 * deliberately does NOT cache a list anymore, so every consumer that needs
 * agents reads from this hook.
 */
export function useInfiniteAgents(options?: UseInfiniteAgentsOptions) {
  const filters: AgentsFilters = {
    searchTerm: options?.searchTerm?.trim() || undefined,
    status: options?.status,
    modelProvider: options?.modelProvider,
    platformTarget: options?.platformTarget,
    planCode: options?.planCode,
  };
  const limit = options?.limit ?? PAGE_SIZE;
  const enabled = options?.enabled ?? true;

  const query = useInfiniteQuery({
    queryKey: queryKeys.agentsInfinite(filters),
    queryFn: ({ pageParam }) =>
      agentService.getAgentsCursor({
        ...filters,
        limit,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes — agents change less frequently than conversations
    retry: (failureCount, error: AxiosError) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403 || status === 429) return false;
      return failureCount < 2;
    },
  });

  const agents = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    agents,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
    isRefetching: query.isRefetching,
  };
}
