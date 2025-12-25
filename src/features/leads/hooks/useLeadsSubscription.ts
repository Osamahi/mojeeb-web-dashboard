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

    console.log('========================================');
    console.log('[Leads Subscription] 🚀 INITIALIZING SUBSCRIPTION');
    console.log('[Leads Subscription] Agent ID:', agentId);
    console.log('[Leads Subscription] Filter:', `agent_id=eq.${agentId}`);
    console.log('[Leads Subscription] Timestamp:', new Date().toISOString());
    console.log('========================================');

    const handleChange = (payload: any) => {
      console.log('========================================');
      console.log('[Leads Subscription] 🎉 EVENT RECEIVED!');
      console.log('[Leads Subscription] Event Type:', payload.eventType);
      console.log('[Leads Subscription] Timestamp:', new Date().toISOString());
      console.log('[Leads Subscription] Payload:', payload);

      if (payload.eventType === 'INSERT') {
        const newLead = payload.new as LeadRow;
        console.log('[Leads Subscription] NEW Lead:', newLead);
        console.log('[Leads Subscription] Lead Name:', newLead.name);
        console.log('[Leads Subscription] Lead Agent ID:', newLead.agent_id);
      } else if (payload.eventType === 'UPDATE') {
        const oldLead = payload.old as LeadRow;
        const newLead = payload.new as LeadRow;
        console.log('[Leads Subscription] OLD Lead:', oldLead);
        console.log('[Leads Subscription] NEW Lead:', newLead);
        console.log('[Leads Subscription] Changed fields:', {
          name: oldLead?.name !== newLead.name ? { old: oldLead?.name, new: newLead.name } : 'unchanged',
          status: oldLead?.status !== newLead.status ? { old: oldLead?.status, new: newLead.status } : 'unchanged',
          phone: oldLead?.phone !== newLead.phone ? { old: oldLead?.phone, new: newLead.phone } : 'unchanged',
        });
      } else if (payload.eventType === 'DELETE') {
        const deletedLead = payload.old as LeadRow;
        console.log('[Leads Subscription] DELETED Lead:', deletedLead);
        console.log('[Leads Subscription] Lead Name:', deletedLead.name);
      }

      console.log('[Leads Subscription] 🔄 Updating cache...');
      console.log('========================================');

      if (payload.eventType === 'UPDATE') {
        // For UPDATE: Update all leads queries (they have different filters in the key)
        const updatedLeadRow = payload.new as LeadRow;

        console.log('[Leads Subscription] 📦 Updating all leads query variants...');

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
          // Preserve notes from payload or existing cache
          notes: (updatedLeadRow as any).notes || [],
        };

        console.log('[Leads Subscription] 📝 Converted updatedLead:', updatedLead);

        // Update all query variants (different filter combinations)
        queryClient.setQueriesData(
          { queryKey: queryKeys.leads(agentId) },
          (oldData: any[] | undefined) => {
            console.log('[Leads Subscription] 🔍 setQueriesData callback - oldData:', oldData);
            if (!oldData) {
              console.log('[Leads Subscription] ⚠️ No oldData for this query variant');
              return oldData;
            }

            const existingLead = oldData.find(lead => lead.id === updatedLead.id);
            console.log('[Leads Subscription] 🔍 Existing lead in cache:', existingLead);

            // Create new array reference to trigger re-render
            const newData = oldData.map(lead => {
              if (lead.id === updatedLead.id) {
                // Preserve notes from existing lead if not in payload
                const mergedLead = {
                  ...lead,
                  ...updatedLead,
                  notes: updatedLead.notes.length > 0 ? updatedLead.notes : lead.notes,
                };
                console.log('[Leads Subscription] ✨ Merged lead:', mergedLead);
                return mergedLead;
              }
              return lead;
            });

            console.log('[Leads Subscription] 📤 Returning new data array (length:', newData.length, ')');
            return newData;
          }
        );

        console.log('[Leads Subscription] ✅ Row updated in all query caches (no refetch)');
      } else if (payload.eventType === 'INSERT') {
        // For INSERT: Invalidate to refetch with proper formatting
        queryClient.invalidateQueries({
          queryKey: queryKeys.leads(agentId),
          refetchType: 'active'
        });

        const newLead = payload.new as LeadRow;
        toast.success(`New lead: ${newLead.name}`);
        console.log('[Leads Subscription] ✅ New lead - cache invalidated');
      } else if (payload.eventType === 'DELETE') {
        // For DELETE: Remove lead from the list
        const deletedLead = payload.old as LeadRow;

        queryClient.setQueryData(
          queryKeys.leads(agentId),
          (oldData: any[] | undefined) => {
            if (!oldData) return oldData;
            // Create new array reference to trigger re-render
            return oldData.filter(lead => lead.id !== deletedLead.id);
          }
        );

        toast.info(`Lead deleted: ${deletedLead.name}`);
        console.log('[Leads Subscription] ✅ Lead removed from cache');
      }

      // Always invalidate stats (lightweight query)
      queryClient.invalidateQueries({ queryKey: queryKeys.leadStats(agentId) });

      console.log('========================================');
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
        console.log('[Leads Subscription] 📡 Channel Status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('[Leads Subscription] ✅ Successfully subscribed to leads updates');
          console.log('[Leads Subscription] Listening for events on table: leads');
          console.log('[Leads Subscription] Filter: agent_id =', agentId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Leads Subscription] ❌ CHANNEL ERROR - Subscription failed');

          // Retry connection after a delay
          setTimeout(() => {
            console.log('[Leads Subscription] 🔄 Retrying connection...');
            queryClient.invalidateQueries({
              queryKey: queryKeys.leads(agentId),
              refetchType: 'active'
            });
          }, 2000);
        } else if (status === 'TIMED_OUT') {
          console.error('[Leads Subscription] ⏱️ TIMED OUT - Connection timeout');
        } else if (status === 'CLOSED') {
          console.log('[Leads Subscription] 🔒 Channel closed');
        }
      });

    console.log('[Leads Subscription] 📺 Channel created:', channel);

    // Register channel for cleanup on logout
    channelRegistry.register(channel, `leads-${agentId}`);

    // Cleanup on unmount or agentId change
    return () => {
      console.log('[Leads Subscription] 🧹 Cleaning up subscription for agent:', agentId);
      channelRegistry.unregister(channel);
      supabase.removeChannel(channel);
    };
  }, [agentId, queryClient]);
}

/**
 * Hook for subscribing to a single lead's real-time updates.
 * Useful for detail drawers or individual lead views.
 *
 * @param leadId - The lead ID to watch
 * @param enabled - Whether to enable the subscription (default: true)
 *
 * @example
 * ```tsx
 * export default function LeadDetailsDrawer({ leadId }) {
 *   const { data: lead } = useLead(leadId);
 *   useLeadSubscription(leadId); // Add real-time updates
 *
 *   return <LeadDetails lead={lead} />;
 * }
 * ```
 */
export function useLeadSubscription(leadId: string | undefined, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!leadId || !enabled) return;

    console.log('[Lead Subscription] Setting up subscription for lead:', leadId);

    const channel = supabase
      .channel(`lead-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `id=eq.${leadId}`,
        },
        (payload) => {
          console.log('[Lead Subscription] Lead updated:', payload);

          // Invalidate query to trigger refetch with new data
          queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });

          const updatedLead = payload.new as LeadRow;

          // Also invalidate all leads queries (including all filter variations)
          queryClient.invalidateQueries({
            queryKey: queryKeys.leads(updatedLead.agent_id),
            refetchType: 'active'
          });
        }
      )
      .subscribe();

    // Register channel for cleanup on logout
    channelRegistry.register(channel, `lead-${leadId}`);

    return () => {
      console.log('[Lead Subscription] Cleaning up subscription for lead:', leadId);
      channelRegistry.unregister(channel);
      supabase.removeChannel(channel);
    };
  }, [leadId, enabled, queryClient]);
}
