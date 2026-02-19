/**
 * Leads Real-time Subscription Hook
 * Supabase Realtime subscriptions for leads table - NO POLLING!
 *
 * Pattern: Document Jobs approach (Pattern B)
 * - Combined React Query + Realtime in single hook
 * - Query invalidation strategy (simpler than setQueryData)
 * - Inline toast notifications
 *
 * Usage:
 * ```tsx
 * const { data: leads } = useLeads();
 * useLeadsSubscription(); // Add this line for real-time updates
 * ```
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { channelRegistry } from '@/lib/supabaseChannelRegistry';
import { parseNoteMetadata } from '../utils/noteHelpers';

/**
 * Database row type for leads table (snake_case)
 * This represents the raw Supabase Realtime payload structure
 */
interface LeadRow {
  id: string;
  agent_id: string;
  name: string;
  phone: string | null;
  status: string;
  custom_fields: Record<string, any>;
  summary: string | null;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for note (snake_case from Supabase)
 */
interface NoteRow {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  note_type: string;
  is_edited: boolean;
  is_deleted: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

/**
 * Transform note from snake_case (Supabase) to camelCase (frontend)
 */
function transformNote(apiNote: NoteRow): any {
  const transformed = {
    id: apiNote.id,
    userId: apiNote.user_id,
    userName: apiNote.user_name,
    text: apiNote.text,
    noteType: apiNote.note_type,
    isEdited: apiNote.is_edited,
    isDeleted: apiNote.is_deleted,
    metadata: parseNoteMetadata(apiNote.metadata),
    createdAt: apiNote.created_at,
    updatedAt: apiNote.updated_at,
  };

  return transformed;
}

/**
 * Hook for subscribing to real-time leads updates.
 *
 * Features:
 * - Single WebSocket connection per agent
 * - Instant updates when leads are created, updated, or deleted
 * - Page refresh resilient - reconnects automatically
 * - Multi-user safe - sees updates from all users
 * - Toast notifications for new leads and deletions
 *
 * This hook ONLY handles subscriptions. Use with `useLeads()` for data fetching.
 *
 * @example
 * ```tsx
 * export default function LeadsPage() {
 *   const { data: leads, isLoading } = useLeads();
 *   useLeadsSubscription(); // Add real-time updates
 *
 *   return <LeadsList leads={leads} />;
 * }
 * ```
 */
export function useLeadsSubscription() {
  const { agentId } = useAgentContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!agentId) {
      console.warn('[Leads Subscription] No agentId provided, skipping subscription');
      return;
    }

    const handleChange = (payload: any) => {
      if (payload.eventType === 'UPDATE') {
        const updatedLeadRow = payload.new as LeadRow;

        // Convert snake_case to camelCase
        const updatedLead: any = {
          id: updatedLeadRow.id,
          agentId: updatedLeadRow.agent_id,
          name: updatedLeadRow.name,
          phone: updatedLeadRow.phone,
          status: updatedLeadRow.status,
          customFields: updatedLeadRow.custom_fields,
          summary: updatedLeadRow.summary,
          conversationId: updatedLeadRow.conversation_id,
          createdAt: updatedLeadRow.created_at,
          updatedAt: updatedLeadRow.updated_at,
          notes: ((updatedLeadRow as any).notes || []).map((note: NoteRow) => transformNote(note)),
        };

        // Update all query variants (different filter combinations)
        queryClient.setQueriesData(
          { queryKey: queryKeys.leads(agentId) },
          (oldData: any) => {
            if (!oldData) return oldData;

            // Check if this is an infinite query structure
            if (oldData.pages && Array.isArray(oldData.pages)) {
              // Update lead within the infinite query pages
              const newPages = oldData.pages.map((page: any) => {
                if (!page.leads || !Array.isArray(page.leads)) {
                  return page;
                }

                const existingLead = page.leads.find((lead: any) => lead.id === updatedLead.id);
                if (!existingLead) {
                  return page; // Lead not in this page
                }

                // Update the lead in this page
                const updatedLeads = page.leads.map((lead: any) => {
                  if (lead.id === updatedLead.id) {
                    // SMART NOTES MERGE: Compare cached vs payload notes
                    let finalNotes = lead.notes;
                    if (updatedLead.notes && updatedLead.notes.length > 0) {
                      const cachedCount = lead.notes?.length || 0;
                      const payloadCount = updatedLead.notes.length;

                      if (payloadCount > cachedCount) {
                        finalNotes = updatedLead.notes;
                      } else if (cachedCount > payloadCount) {
                        finalNotes = lead.notes;
                      } else {
                        finalNotes = updatedLead.notes;
                      }
                    }

                    return {
                      ...lead,
                      ...(updatedLead.name !== undefined && { name: updatedLead.name }),
                      ...(updatedLead.phone !== undefined && { phone: updatedLead.phone }),
                      ...(updatedLead.status !== undefined && { status: updatedLead.status }),
                      ...(updatedLead.summary !== undefined && { summary: updatedLead.summary }),
                      ...(updatedLead.customFields !== undefined && { customFields: updatedLead.customFields }),
                      ...(updatedLead.conversationId !== undefined && { conversationId: updatedLead.conversationId }),
                      ...(updatedLead.updatedAt !== undefined && { updatedAt: updatedLead.updatedAt }),
                      notes: finalNotes,
                    };
                  }
                  return lead;
                });

                return {
                  ...page,
                  leads: updatedLeads,
                };
              });

              return {
                ...oldData,
                pages: newPages,
              };
            }

            // Fallback: Flat array structure (for non-infinite queries)
            if (!Array.isArray(oldData)) {
              return oldData;
            }

            const newData = oldData.map((lead: any) => {
              if (lead.id === updatedLead.id) {
                // SMART NOTES MERGE: Compare cached vs payload notes
                let finalNotes = lead.notes;
                if (updatedLead.notes && updatedLead.notes.length > 0) {
                  const cachedCount = lead.notes?.length || 0;
                  const payloadCount = updatedLead.notes.length;

                  if (payloadCount > cachedCount) {
                    finalNotes = updatedLead.notes;
                  } else if (cachedCount > payloadCount) {
                    finalNotes = lead.notes;
                  } else {
                    finalNotes = updatedLead.notes;
                  }
                }

                return {
                  ...lead,
                  ...(updatedLead.name !== undefined && { name: updatedLead.name }),
                  ...(updatedLead.phone !== undefined && { phone: updatedLead.phone }),
                  ...(updatedLead.status !== undefined && { status: updatedLead.status }),
                  ...(updatedLead.summary !== undefined && { summary: updatedLead.summary }),
                  ...(updatedLead.customFields !== undefined && { customFields: updatedLead.customFields }),
                  ...(updatedLead.conversationId !== undefined && { conversationId: updatedLead.conversationId }),
                  ...(updatedLead.updatedAt !== undefined && { updatedAt: updatedLead.updatedAt }),
                  notes: finalNotes,
                };
              }
              return lead;
            });

            return newData;
          }
        );
      } else if (payload.eventType === 'INSERT') {
        queryClient.invalidateQueries({
          queryKey: queryKeys.leads(agentId),
          refetchType: 'active'
        });

        const newLead = payload.new as LeadRow;
        toast.success(`New lead: ${newLead.name}`);
      } else if (payload.eventType === 'DELETE') {
        const deletedLead = payload.old as LeadRow;

        queryClient.setQueryData(
          queryKeys.leads(agentId),
          (oldData: any[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.filter(lead => lead.id !== deletedLead.id);
          }
        );

        toast.info(`Lead deleted: ${deletedLead.name}`);
      }

      // Always invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.leadStats(agentId) });
    };

    const channel = supabase
      .channel(`leads-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `agent_id=eq.${agentId}`,
        },
        handleChange
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `agent_id=eq.${agentId}`,
        },
        handleChange
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'leads',
          filter: `agent_id=eq.${agentId}`,
        },
        handleChange
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[Leads Subscription] Channel error - retrying in 2s');
          setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.leads(agentId),
              refetchType: 'active'
            });
          }, 2000);
        }
      });

    // Register channel for cleanup on logout
    channelRegistry.register(channel, `leads-${agentId}`);

    // Cleanup on unmount or agentId change
    return () => {
      channelRegistry.unregister(channel);
      supabase.removeChannel(channel);
    };
  }, [agentId, queryClient]);
}

