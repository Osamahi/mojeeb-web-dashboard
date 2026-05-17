/**
 * Canonical single-conversation hooks.
 *
 * Why these exist: the conversation list is filtered (search/source/urgent) and
 * paginated, so the selected conversation isn't guaranteed to be in the list cache.
 * Reading from a Zustand snapshot caused stale state when realtime updates landed
 * on jsonb columns (e.g. `triggered_actions`) — see the manual lead-capture bug.
 *
 * The fix: Zustand holds only the selected ID. Data always comes through React Query,
 * keyed by ID, so realtime invalidations and HTTP refetches are the single source of
 * truth. Anyone needing the conversation object reads it via these hooks.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AxiosError } from 'axios';
import { queryKeys } from '@/lib/queryKeys';
import { fetchConversationById, type ConversationResponse } from '../services/conversationApi';
import { useConversationStore } from '../stores/conversationStore';
import type { Conversation } from '../types';

/**
 * Fetches a single conversation row by ID. Realtime invalidates this key on every
 * UPDATE so the row stays fresh without a Zustand mirror.
 */
export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conversation(id),
    queryFn: () => fetchConversationById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error: AxiosError) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) return false;
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Convenience reader for the currently-selected conversation. Returns the live
 * Conversation from the query cache (always fresh), or undefined when nothing is
 * selected or the fetch is in flight.
 *
 * Seeds the cache from the list whenever a new conversation is selected so the
 * panel renders instantly with whatever the list already knows — the real fetch
 * runs in the background to fill in any fields the list response lacks.
 */
export function useSelectedConversation(): Conversation | undefined {
  const selectedConversationId = useConversationStore((s) => s.selectedConversationId);
  const queryClient = useQueryClient();

  // Seed the single-conversation cache from any list page that already has this row.
  // Avoids a loading flicker when the user clicks a conversation — the list already
  // fetched it. The background refetch then ensures freshness.
  useEffect(() => {
    if (!selectedConversationId) return;
    if (queryClient.getQueryData(queryKeys.conversation(selectedConversationId))) return;

    const seed = findConversationInListCache(queryClient, selectedConversationId);
    if (seed) {
      queryClient.setQueryData(queryKeys.conversation(selectedConversationId), seed);
    }
  }, [selectedConversationId, queryClient]);

  const { data } = useConversation(selectedConversationId ?? undefined);
  return data as unknown as Conversation | undefined;
}

/**
 * Walks all cached `['conversations', agentId, ...]` infinite-query pages and returns
 * the first conversation matching the given id. Used to seed `useSelectedConversation`
 * from the list cache for an instant initial render.
 */
function findConversationInListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string
): ConversationResponse | undefined {
  const entries = queryClient.getQueriesData<{
    pages?: Array<{ items?: ConversationResponse[] }>;
  }>({ queryKey: ['conversations'] });

  for (const [, data] of entries) {
    const pages = data?.pages;
    if (!pages) continue;
    for (const page of pages) {
      const hit = page.items?.find((c) => c.id === conversationId);
      if (hit) return hit;
    }
  }
  return undefined;
}
