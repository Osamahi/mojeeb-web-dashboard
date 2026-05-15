/**
 * Lead Hooks
 * React Query hooks for lead operations
 * Follows Knowledge Base architecture patterns
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { isToastHandled } from '@/lib/errors';
import { useAgentContext } from '@/hooks/useAgentContext';
import { leadService } from '../services/leadService';
import { queryKeys } from '@/lib/queryKeys';
import type {
  LeadFilters,
  CreateLeadRequest,
  UpdateLeadRequest,
  CreateNoteRequest,
  UpdateNoteRequest,
  Lead,
  LeadNote
} from '../types';

// ========================================
// Query Hooks (Data Fetching)
// ========================================

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
 * Fetch the lead captured for a specific conversation (if any).
 * Returns null when no lead is linked — the hook's data being null is the
 * signal to hide the "View lead" entry point in the conversation header.
 *
 * Callers should pass enabled=false when the conversation has no
 * lead_capture triggered action so we don't fire a guaranteed-404 request.
 */
export function useLeadByConversation(
  conversationId: string | undefined,
  agentId: string | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['lead', 'by-conversation', conversationId, agentId],
    queryFn: () => leadService.getLeadByConversation(conversationId!, agentId!),
    enabled: !!conversationId && !!agentId && enabled,
    staleTime: 60_000,
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
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (request: CreateLeadRequest) => leadService.createLead(request),
    onSuccess: () => {
      // Invalidate all leads queries (including all filter variations)
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads(agentId),
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.leadStats(agentId) });
      toast.success(t('leads.lead_created'));
    },
    onError: (error: any) => {
      if (isToastHandled(error)) return;
      const message = error?.response?.data?.message || t('leads.lead_create_failed');
      toast.error(message);
    },
  });
}

/**
 * Assign (or unassign with assignedTo=null) a lead.
 *
 * Mirrors automatically to the linked conversation via the assign_entity
 * RPC on the backend. Optimistically patches the lead's `assignedTo` field
 * in the leads list cache so the avatar updates instantly; on error it
 * rolls back; on success Supabase realtime delivers the canonical value
 * (and we still invalidate the lead detail + history caches).
 */
export function useAssignLead() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      leadId,
      assignedTo,
      reason,
    }: {
      leadId: string;
      assignedTo: string | null;
      reason?: string;
    }) => leadService.assignLead(leadId, agentId!, assignedTo, reason),

    onMutate: async ({ leadId, assignedTo }) => {
      // Cancel in-flight list refetches so they don't overwrite the optimistic patch.
      await queryClient.cancelQueries({ queryKey: queryKeys.leads(agentId) });

      // Patch every page of every infinite-cursor query that has this lead.
      // We can't enumerate the exact filter combos, so we walk the whole
      // matcher and only touch caches whose data shape matches.
      const prevByKey: Array<[unknown[], unknown]> = [];
      const matched = queryClient.getQueriesData<any>({
        queryKey: queryKeys.leads(agentId),
      });
      for (const [key, value] of matched) {
        if (!value || typeof value !== 'object') continue;
        // useInfiniteLeads stores `{ pages: [{ leads: Lead[] }] }`
        if (Array.isArray((value as any).pages)) {
          prevByKey.push([key, value]);
          const next = {
            ...(value as any),
            pages: (value as any).pages.map((page: any) => ({
              ...page,
              leads: Array.isArray(page.leads)
                ? page.leads.map((l: Lead) =>
                    l.id === leadId ? { ...l, assignedTo } : l,
                  )
                : page.leads,
            })),
          };
          queryClient.setQueryData(key, next);
        }
      }

      // Single-lead detail cache
      const prevLead = queryClient.getQueryData<Lead>(queryKeys.lead(leadId));
      if (prevLead) {
        queryClient.setQueryData<Lead>(queryKeys.lead(leadId), {
          ...prevLead,
          assignedTo,
        });
      }

      return { prevByKey, prevLead };
    },

    onError: (error: any, { leadId }, context) => {
      // Roll back optimistic patches.
      if (context?.prevByKey) {
        for (const [key, value] of context.prevByKey) {
          queryClient.setQueryData(key as any, value);
        }
      }
      if (context?.prevLead) {
        queryClient.setQueryData(queryKeys.lead(leadId), context.prevLead);
      }

      if (isToastHandled(error)) return;
      const message = error?.response?.data?.message || t('leads.assignment_failed');
      toast.error(message);
    },

    onSuccess: () => {
      toast.success(t('leads.assignment_updated'));
    },

    onSettled: (_, __, { leadId }) => {
      // Refresh the lead's history view if it's open; realtime handles the
      // list/detail caches but the assignment_log isn't on a realtime channel.
      queryClient.invalidateQueries({
        queryKey: ['lead', 'assignment-history', leadId],
      });
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

      if (isToastHandled(error)) return;
      const message = error?.response?.data?.message || t('leads.lead_update_failed');
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
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (leadId: string) => leadService.deleteLead(leadId, agentId!),
    onSuccess: () => {
      // Invalidate all leads queries (including all filter variations)
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads(agentId),
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.leadStats(agentId) });
      toast.success(t('leads.lead_deleted'));
    },
    onError: (error: any) => {
      if (isToastHandled(error)) return;
      const message = error?.response?.data?.message || t('leads.lead_delete_failed');
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
  const { t } = useTranslation();

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

      if (isToastHandled(error)) return;
      const message = error?.response?.data?.message || t('leads.note_add_failed');
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
      toast.success(t('leads.note_added'));
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
  const { t } = useTranslation();

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
      toast.success(t('leads.note_updated'));
    },
    onError: (error: any) => {
      if (isToastHandled(error)) return;
      const message = error?.response?.data?.message || t('leads.note_update_failed');
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
  const { t } = useTranslation();

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
      toast.success(t('leads.note_deleted'));
    },
    onError: (error: any) => {
      if (isToastHandled(error)) return;
      const message = error?.response?.data?.message || t('leads.note_delete_failed');
      toast.error(message);
    },
  });
}
