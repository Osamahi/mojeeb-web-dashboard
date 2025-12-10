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
  CreateNoteRequest,
  UpdateNoteRequest
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
 * Returns counts by status (new, processing, completed)
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
// Note Hooks
// ========================================

/**
 * Fetch all notes for a lead (excludes soft-deleted by default)
 * @param leadId - The lead ID to fetch notes for
 * @param includeDeleted - Whether to include soft-deleted notes
 */
export function useLeadNotes(leadId: string | undefined, includeDeleted = false) {
  return useQuery({
    queryKey: ['leads', leadId, 'notes', includeDeleted],
    queryFn: () => leadService.getLeadNotes(leadId!, includeDeleted),
    enabled: !!leadId,
    staleTime: 30000, // 30 seconds - notes don't change frequently
  });
}

/**
 * Add a note to a lead
 * Invalidates lead notes, lead details, and leads list on success
 */
export function useCreateLeadNote() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, request }: { leadId: string; request: CreateNoteRequest }) =>
      leadService.createLeadNote(leadId, request),
    onSuccess: (_, { leadId }) => {
      // Invalidate notes query
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'notes'] });
      // Invalidate lead detail (to show updated notes)
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      // Invalidate leads list (to show latest note)
      queryClient.invalidateQueries({ queryKey: queryKeys.leads(agentId) });
      toast.success('Note added successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to add note';
      toast.error(message);
    },
  });
}

/**
 * Update an existing note (only by note owner)
 * Invalidates lead notes on success
 */
export function useUpdateLeadNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      noteId,
      request,
    }: {
      leadId: string;
      noteId: string;
      request: UpdateNoteRequest;
    }) => leadService.updateLeadNote(leadId, noteId, request),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      toast.success('Note updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update note';
      toast.error(message);
    },
  });
}

/**
 * Delete a note (soft delete, only by note owner)
 * Invalidates lead notes and leads list on success
 */
export function useDeleteLeadNote() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, noteId }: { leadId: string; noteId: string }) =>
      leadService.deleteLeadNote(leadId, noteId),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads(agentId) });
      toast.success('Note deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete note';
      toast.error(message);
    },
  });
}
