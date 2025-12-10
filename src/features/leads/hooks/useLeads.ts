/**
 * Lead Hooks
 * React Query hooks for lead operations
 * Follows Knowledge Base architecture patterns
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAgentContext } from '@/hooks/useAgentContext';
import { leadService } from '../services/leadService';
import { queryKeys } from '@/lib/queryKeys';
import type {
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadFieldDefinition,
  CreateFieldDefinitionRequest,
  CreateCommentRequest,
  UpdateCommentRequest
} from '../types';

// ========================================
// Query Hooks (Data Fetching)
// ========================================

/**
 * Fetch all leads for the current agent
 * Auto-scoped to selected agent from context
 */
export function useLeads() {
  const { agentId } = useAgentContext();

  return useQuery({
    queryKey: queryKeys.leads(agentId),
    queryFn: () => leadService.getLeads(agentId!),
    enabled: !!agentId,
  });
}

/**
 * Fetch a single lead by ID
 * @param leadId - The lead ID to fetch
 */
export function useLead(leadId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.lead(leadId),
    queryFn: () => leadService.getLead(leadId!),
    enabled: !!leadId,
  });
}

/**
 * Fetch lead statistics for the current agent
 * Returns counts by status (new, contacted, qualified, converted, lost)
 */
export function useLeadStatistics() {
  const { agentId } = useAgentContext();

  return useQuery({
    queryKey: queryKeys.leadStats(agentId),
    queryFn: () => leadService.getLeadStatistics(agentId!),
    enabled: !!agentId,
  });
}

/**
 * Fetch custom field definitions for the current agent
 */
export function useLeadFieldDefinitions() {
  const { agentId } = useAgentContext();

  return useQuery({
    queryKey: queryKeys.leadFieldDefs(agentId),
    queryFn: () => leadService.getFieldDefinitions(agentId!),
    enabled: !!agentId,
  });
}

// ========================================
// Mutation Hooks (Data Modifications)
// ========================================

/**
 * Create a new lead
 * Invalidates leads list and stats on success
 */
export function useCreateLead() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateLeadRequest) => leadService.createLead(request),
    onSuccess: () => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.leads(agentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leadStats(agentId) });
      toast.success('Lead created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create lead';
      toast.error(message);
    },
  });
}

/**
 * Update an existing lead
 * Uses optimistic updates for instant UI feedback
 * Invalidates leads list, specific lead, and stats on success
 */
export function useUpdateLead() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, request }: { leadId: string; request: UpdateLeadRequest }) =>
      leadService.updateLead(leadId, request),

    // Optimistic update - update cache immediately before API call
    onMutate: async ({ leadId, request }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.leads(agentId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.lead(leadId) });

      // Snapshot the previous values for rollback
      const previousLeads = queryClient.getQueryData(queryKeys.leads(agentId));
      const previousLead = queryClient.getQueryData(queryKeys.lead(leadId));

      // Optimistically update leads list
      queryClient.setQueryData(queryKeys.leads(agentId), (old: any) => {
        if (!old) return old;
        return old.map((lead: any) =>
          lead.id === leadId ? { ...lead, ...request } : lead
        );
      });

      // Optimistically update individual lead
      queryClient.setQueryData(queryKeys.lead(leadId), (old: any) => {
        if (!old) return old;
        return { ...old, ...request };
      });

      // Return context with previous data for rollback
      return { previousLeads, previousLead };
    },

    onSuccess: (_, { leadId }) => {
      // Refetch to ensure we have the latest data from server
      queryClient.invalidateQueries({ queryKey: queryKeys.leads(agentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leadStats(agentId) });
      toast.success('Lead updated successfully');
    },

    onError: (error: any, _, context) => {
      // Rollback optimistic updates on error
      if (context?.previousLeads) {
        queryClient.setQueryData(queryKeys.leads(agentId), context.previousLeads);
      }
      if (context?.previousLead) {
        queryClient.setQueryData(queryKeys.lead(context.previousLead.id), context.previousLead);
      }

      const message = error?.response?.data?.message || 'Failed to update lead';
      toast.error(message);
    },
  });
}

/**
 * Delete a lead
 * Invalidates leads list and stats on success
 */
export function useDeleteLead() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) => leadService.deleteLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads(agentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leadStats(agentId) });
      toast.success('Lead deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete lead';
      toast.error(message);
    },
  });
}

// ========================================
// Custom Field Definition Mutations
// ========================================

/**
 * Create a custom field definition
 * Invalidates field definitions on success
 */
export function useCreateFieldDefinition() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateFieldDefinitionRequest) =>
      leadService.createFieldDefinition(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadFieldDefs(agentId) });
      toast.success('Custom field created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create custom field';
      toast.error(message);
    },
  });
}

/**
 * Delete a custom field definition
 * Invalidates field definitions on success
 */
export function useDeleteFieldDefinition() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fieldId: string) => leadService.deleteFieldDefinition(fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadFieldDefs(agentId) });
      toast.success('Custom field deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete custom field';
      toast.error(message);
    },
  });
}

// ========================================
// Comment Hooks
// ========================================

/**
 * Fetch all comments for a lead (excludes soft-deleted by default)
 * @param leadId - The lead ID to fetch comments for
 * @param includeDeleted - Whether to include soft-deleted comments
 */
export function useLeadComments(leadId: string | undefined, includeDeleted = false) {
  return useQuery({
    queryKey: ['leads', leadId, 'comments', includeDeleted],
    queryFn: () => leadService.getLeadComments(leadId!, includeDeleted),
    enabled: !!leadId,
    staleTime: 30000, // 30 seconds - comments don't change frequently
  });
}

/**
 * Add a comment to a lead
 * Invalidates lead comments, lead details, and leads list on success
 */
export function useCreateLeadComment() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, request }: { leadId: string; request: CreateCommentRequest }) =>
      leadService.createLeadComment(leadId, request),
    onSuccess: (_, { leadId }) => {
      // Invalidate comments query
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'comments'] });
      // Invalidate lead detail (to show updated comments)
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      // Invalidate leads list (to show latest comment)
      queryClient.invalidateQueries({ queryKey: queryKeys.leads(agentId) });
      toast.success('Comment added successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to add comment';
      toast.error(message);
    },
  });
}

/**
 * Update an existing comment (only by comment owner)
 * Invalidates lead comments on success
 */
export function useUpdateLeadComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      commentId,
      request,
    }: {
      leadId: string;
      commentId: string;
      request: UpdateCommentRequest;
    }) => leadService.updateLeadComment(leadId, commentId, request),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      toast.success('Comment updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update comment';
      toast.error(message);
    },
  });
}

/**
 * Delete a comment (soft delete, only by comment owner)
 * Invalidates lead comments and leads list on success
 */
export function useDeleteLeadComment() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, commentId }: { leadId: string; commentId: string }) =>
      leadService.deleteLeadComment(leadId, commentId),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads(agentId) });
      toast.success('Comment deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete comment';
      toast.error(message);
    },
  });
}
