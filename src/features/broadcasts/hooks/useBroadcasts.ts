/**
 * Broadcast Hooks
 * TanStack Query hooks for broadcast campaign management
 */

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { broadcastService } from '../services/broadcastService';
import type { CreateBroadcastRequest } from '../types/broadcast.types';

export const BROADCAST_QUERY_KEYS = {
  campaigns: (agentId: string) => ['broadcasts', 'campaigns', agentId] as const,
  campaignDetail: (campaignId: string) => ['broadcasts', 'detail', campaignId] as const,
  recipients: (campaignId: string) => ['broadcasts', 'recipients', campaignId] as const,
};

export function useBroadcastCampaigns(agentId?: string, status?: string) {
  return useInfiniteQuery({
    queryKey: [...BROADCAST_QUERY_KEYS.campaigns(agentId || ''), status],
    queryFn: ({ pageParam }) =>
      broadcastService.getCampaigns(agentId!, 20, pageParam, status),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    enabled: !!agentId,
    staleTime: 30 * 1000,
  });
}

export function useBroadcastDetail(agentId?: string, campaignId?: string) {
  return useQuery({
    queryKey: BROADCAST_QUERY_KEYS.campaignDetail(campaignId || ''),
    queryFn: () => broadcastService.getCampaignDetail(agentId!, campaignId!),
    enabled: !!agentId && !!campaignId,
    staleTime: 5 * 1000,
  });
}

export function useBroadcastRecipients(agentId?: string, campaignId?: string, status?: string) {
  return useInfiniteQuery({
    queryKey: [...BROADCAST_QUERY_KEYS.recipients(campaignId || ''), status],
    queryFn: ({ pageParam }) =>
      broadcastService.getRecipients(agentId!, campaignId!, 50, pageParam, status),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    enabled: !!agentId && !!campaignId,
    staleTime: 10 * 1000,
  });
}

export function useCreateBroadcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, request }: { agentId: string; request: CreateBroadcastRequest }) =>
      broadcastService.createCampaign(agentId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    },
  });
}

export function useRetryFailed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, campaignId }: { agentId: string; campaignId: string }) =>
      broadcastService.retryFailed(agentId, campaignId),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({
        queryKey: BROADCAST_QUERY_KEYS.campaignDetail(campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: BROADCAST_QUERY_KEYS.recipients(campaignId),
      });
    },
  });
}
