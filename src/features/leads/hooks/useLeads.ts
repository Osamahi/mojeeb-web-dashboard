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
import type { CreateLeadRequest, UpdateLeadRequest, LeadFieldDefinition, CreateFieldDefinitionRequest } from '../types';

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
 * Invalidates leads list, specific lead, and stats on success
 */
export function useUpdateLead() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, request }: { leadId: string; request: UpdateLeadRequest }) =>
      leadService.updateLead(leadId, request),
    onSuccess: (_, { leadId }) => {
      // Invalidate multiple queries
      queryClient.invalidateQueries({ queryKey: queryKeys.leads(agentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leadStats(agentId) });
      toast.success('Lead updated successfully');
    },
    onError: (error: any) => {
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
