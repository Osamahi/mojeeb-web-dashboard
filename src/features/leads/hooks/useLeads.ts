/**
 * Lead Hooks
 * React Query hooks for lead operations
 * Follows Knowledge Base architecture patterns
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAgentContext } from '@/hooks/useAgentContext';
import { leadService } from '../services/leadService';
import { queryKeys } from '@/lib/queryKeys';
import type {
  LeadFilters,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadFieldDefinition,
  CreateFieldDefinitionRequest,
  CreateNoteRequest,
  UpdateNoteRequest,
  Lead,
  LeadNote
} from '../types';

// ========================================
// Query Hooks (Data Fetching)
// ========================================

/**
 * Fetch all leads for the current agent with optional filters
 * Auto-scoped to selected agent from context
 * Query key includes filters to enable proper caching per filter combination
 */
export function useLeads(filters?: Partial<LeadFilters>) {
  const { agentId } = useAgentContext();

  return useQuery({
    queryKey: [...queryKeys.leads(agentId), filters],
    queryFn: () => leadService.getLeads(agentId!, filters),
    enabled: !!agentId,
    placeholderData: undefined, // Prevent flash of old data
  });
}

/**
 * Fetch paginated leads with infinite scroll support (cursor-based)
 * Auto-scoped to selected agent from context
 * Uses cursor pagination for constant-time performance with any data size
 * No COUNT(*) queries - optimal for infinite scroll UX
 */
export function useInfiniteLeads(filters?: Partial<LeadFilters>) {
  const { agentId } = useAgentContext();

  return useInfiniteQuery({
    queryKey: [...queryKeys.leads(agentId), 'infinite-cursor', filters],
    queryFn: ({ pageParam }) =>
      leadService.getLeadsCursor(
        agentId!,
        50, // Load 50 leads per batch
        pageParam, // Base64-encoded cursor (undefined for first page)
        filters
      ),
    enabled: !!agentId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // Return next_cursor if there are more pages, otherwise undefined
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    // Flatten all pages into a single array for easy consumption
    select: (data) => {
      const lastPage = data.pages[data.pages.length - 1];

      return {
        leads: data.pages.flatMap((page) => page.leads),
        hasMore: lastPage?.hasMore ?? false,
        nextCursor: lastPage?.nextCursor ?? null,
      };
    },
  });
}

/**
 * Fetch a single lead by ID
 * @param leadId - The lead ID to fetch
 * @param agentId - The agent ID (optional, defaults to current agent from context)
 */
export function useLead(leadId: string | undefined, agentId?: string) {
  const { agentId: contextAgentId } = useAgentContext();
  const effectiveAgentId = agentId || contextAgentId;

  return useQuery({
    queryKey: queryKeys.lead(leadId),
    queryFn: () => leadService.getLead(leadId!, effectiveAgentId!),
    enabled: !!leadId && !!effectiveAgentId,
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
      // Invalidate all leads queries (including all filter variations)
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads(agentId),
        refetchType: 'active'
      });
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
 * Relies on Supabase realtime subscription to update cache automatically
 * No invalidation needed - subscription handler updates React Query cache immediately
 */
export function useUpdateLead() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ leadId, request }: { leadId: string; request: UpdateLeadRequest }) =>
      leadService.updateLead(leadId, agentId!, request),

    onSuccess: () => {
      // ✅ NO invalidation/refetch needed - Supabase subscription updates cache automatically
      // This prevents notes from reloading unnecessarily
      // Stats still need invalidation since they're not updated by subscription
      queryClient.invalidateQueries({
        queryKey: queryKeys.leadStats(agentId),
        refetchType: 'active'
      });

      toast.success(t('leads.lead_updated'));
    },

    onError: (error: any) => {
      // Development-only error logging
      if (process.env.NODE_ENV === 'development') {
        console.error('[useUpdateLead] Error:', error?.response?.data);
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
    mutationFn: (leadId: string) => leadService.deleteLead(leadId, agentId!),
    onSuccess: () => {
      // Invalidate all leads queries (including all filter variations)
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads(agentId),
        refetchType: 'active'
      });
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
 * @param agentId - The agent ID that owns the lead
 * @param includeDeleted - Whether to include soft-deleted notes
 */
export function useLeadNotes(
  leadId: string | undefined,
  agentId: string | undefined,
  includeDeleted = false
) {
  return useQuery({
    queryKey: ['leads', leadId, 'notes', includeDeleted],
    queryFn: () => leadService.getLeadNotes(leadId!, agentId!, includeDeleted),
    enabled: !!leadId && !!agentId,
    staleTime: 30000, // 30 seconds - notes don't change frequently
  });
}

/**
 * Add a note to a lead (OPTIMISTIC UPDATE)
 * Note appears instantly in UI before server confirms
 * Rolls back automatically if server request fails
 */
export function useCreateLeadNote() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['createLeadNote'],
    mutationFn: ({ leadId, request }: { leadId: string; request: CreateNoteRequest }) =>
      leadService.createLeadNote(leadId, agentId!, request),

    // 🚀 OPTIMISTIC UPDATE: Add note immediately to cache before server responds
    onMutate: async ({ leadId, request }) => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['leads', leadId, 'notes'] });

      // Snapshot the previous notes (for rollback on error)
      const previousNotes = queryClient.getQueryData<LeadNote[]>(['leads', leadId, 'notes']);

      // Create optimistic note with temporary ID
      const optimisticNote: LeadNote = {
        id: `temp-${Date.now()}`, // Temporary ID (replaced by server response)
        userId: '', // Will be populated by server
        userName: 'You', // Current user (will be replaced by server)
        text: request.text,
        noteType: request.noteType || 'user_note',
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update the notes cache
      queryClient.setQueryData<LeadNote[]>(
        ['leads', leadId, 'notes'],
        (old) => (old ? [optimisticNote, ...old] : [optimisticNote])
      );

      // Return snapshot for rollback
      return { previousNotes };
    },

    // ❌ ROLLBACK: Restore previous state if mutation fails
    onError: (error: any, { leadId }, context) => {
      // Restore the snapshot
      if (context?.previousNotes) {
        queryClient.setQueryData(['leads', leadId, 'notes'], context.previousNotes);
      }

      const message = error?.response?.data?.message || 'Failed to add note';
      toast.error(message);
    },

    // ✅ FINAL UPDATE: Refetch to ensure consistency with server
    onSettled: (_, __, { leadId }) => {
      // Replace optimistic note with real server data
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      // Invalidate all leads queries (including all filter variations)
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads(agentId),
        refetchType: 'active'
      });
    },

    onSuccess: () => {
      toast.success('Note added successfully');
    },
  });
}

/**
 * Update an existing note (only by note owner)
 * Invalidates lead notes on success
 */
export function useUpdateLeadNote() {
  const { agentId } = useAgentContext();
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
    }) => leadService.updateLeadNote(leadId, noteId, agentId!, request),
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
      leadService.deleteLeadNote(leadId, noteId, agentId!),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      // Invalidate all leads queries (including all filter variations)
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads(agentId),
        refetchType: 'active'
      });
      toast.success('Note deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete note';
      toast.error(message);
    },
  });
}
