import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { agentService } from '../services/agentService';
import type { CreateFollowUpStepRequest, UpdateFollowUpStepRequest } from '../types/followUp.types';
import { toast } from 'sonner';

export function useFollowUpSteps(agentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.followUpSteps(agentId),
    queryFn: () => agentService.getFollowUpSteps(agentId!),
    enabled: !!agentId,
  });
}

export function useCreateFollowUpStep(agentId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateFollowUpStepRequest) => {
      if (!agentId) throw new Error('No agent selected');
      return agentService.createFollowUpStep(agentId, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.followUpSteps(agentId) });
    },
    onError: () => {
      toast.error('Failed to create follow-up step');
    },
  });
}

export function useUpdateFollowUpStep(agentId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stepId, request }: { stepId: string; request: UpdateFollowUpStepRequest }) => {
      if (!agentId) throw new Error('No agent selected');
      return agentService.updateFollowUpStep(agentId, stepId, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.followUpSteps(agentId) });
    },
    onError: () => {
      toast.error('Failed to update follow-up step');
    },
  });
}

export function useDeleteFollowUpStep(agentId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stepId: string) => {
      if (!agentId) throw new Error('No agent selected');
      return agentService.deleteFollowUpStep(agentId, stepId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.followUpSteps(agentId) });
    },
    onError: () => {
      toast.error('Failed to delete follow-up step');
    },
  });
}
