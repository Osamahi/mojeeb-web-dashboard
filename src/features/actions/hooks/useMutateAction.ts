/**
 * React Query mutation hooks for action CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actionService } from '../services/actionService';
import type { CreateActionRequest, UpdateActionRequest } from '../types';
import { useAgentContext } from '@/hooks/useAgentContext';
import { toast } from 'sonner';

/**
 * Create action mutation
 */
export function useCreateAction() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: (request: CreateActionRequest) => actionService.createAction(request),
    onSuccess: () => {
      // Invalidate all action queries for this agent
      queryClient.invalidateQueries({ queryKey: ['actions', agentId] });
      toast.success('Action created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create action');
    },
  });
}

/**
 * Update action mutation
 */
export function useUpdateAction() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: ({ actionId, request }: { actionId: string; request: UpdateActionRequest }) =>
      actionService.updateAction(actionId, agentId!, request),
    onSuccess: (_, variables) => {
      // Invalidate specific action and list queries
      queryClient.invalidateQueries({ queryKey: ['actions', agentId, variables.actionId] });
      queryClient.invalidateQueries({ queryKey: ['actions', agentId, 'infinite-cursor'] });
      toast.success('Action updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update action');
    },
  });
}

/**
 * Delete action mutation
 */
export function useDeleteAction() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  return useMutation({
    mutationFn: (actionId: string) => actionService.deleteAction(actionId, agentId!),
    onSuccess: () => {
      // Invalidate all action queries for this agent
      queryClient.invalidateQueries({ queryKey: ['actions', agentId] });
      toast.success('Action deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete action');
    },
  });
}
