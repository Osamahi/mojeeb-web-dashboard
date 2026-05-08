/**
 * useAcceptInvitationMutation Hook
 *
 * TanStack Query mutation for accepting organization invitations
 * Handles organization migration and complete data refresh
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { invitationService } from '../services/invitationService';
import { agentService } from '@/features/agents/services/agentService';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';
import { useInvitationStore } from '../stores/invitationStore';
import { refreshOrganizationData } from '@/lib/organizationDataRefresh';
import { logger } from '@/lib/logger';

interface AcceptInvitationParams {
  token: string;
  organizationName: string;
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ token }: AcceptInvitationParams) => {
      logger.info('[useAcceptInvitationMutation] Accepting invitation (authenticated)', { token: token.substring(0, 10) + '...' });

      // Call backend API to accept invitation for authenticated user
      // This endpoint requires JWT token and doesn't need name/password
      // Backend handles: validate invitation, remove from old org, add to new org
      await invitationService.acceptInvitationAuthenticated(token);

      return { token };
    },

    onSuccess: async (_, variables) => {
      const { organizationName } = variables;

      logger.info('[useAcceptInvitationMutation] Invitation accepted, refreshing data...');

      try {
        // Note: Skipping user profile refresh - backend already handled organization transfer
        // The user's organization_id was updated on the backend when invitation was accepted

        // 1. Clear selected conversation (from old org)
        logger.info('[useAcceptInvitationMutation] Step 1/4: Clearing conversation selection');
        useConversationStore.getState().selectConversation(null);

        // 2. Seed the new org's first agent so the dashboard renders an agent
        // immediately after navigation. Full list is loaded on demand by
        // GlobalAgentSelector / AgentsPage via useInfiniteAgents.
        logger.info('[useAcceptInvitationMutation] Step 2/4: Seeding global selected agent');
        try {
          const firstPage = await agentService.getAgentsCursor({ limit: 1 });
          const firstAgent = firstPage.items[0];
          if (firstAgent) {
            useAgentStore.getState().setGlobalSelectedAgent(firstAgent);
          } else {
            useAgentStore.getState().setGlobalSelectedAgent(null);
          }
        } catch (probeError) {
          logger.warn(
            '[useAcceptInvitationMutation] Agent probe after invitation failed (non-fatal)',
            probeError,
          );
        }

        // 3. Invalidate all organization-scoped queries (includes the
        // useInfiniteAgents cache so consumers refetch against the new org).
        logger.info('[useAcceptInvitationMutation] Step 3/4: Invalidating queries');
        await refreshOrganizationData(queryClient);

        // 4. Clear pending invitations from store
        logger.info('[useAcceptInvitationMutation] Step 4/4: Clearing invitations');
        useInvitationStore.getState().clearInvitations();

        // Show success message
        toast.success(`Successfully joined ${organizationName}!`);

        logger.info('[useAcceptInvitationMutation] ✅ Organization switch complete');

        // Navigate to conversations page (data already refreshed, no reload needed)
        navigate('/conversations', { replace: true });
      } catch (error) {
        logger.error('[useAcceptInvitationMutation] Error during data refresh', error as Error);
        toast.error('Invitation accepted, but some data may not have refreshed. Please refresh the page.');
        // Still navigate away from invitation page
        navigate('/conversations', { replace: true });
      }
    },

    onError: (error: Error) => {
      logger.error('[useAcceptInvitationMutation] Failed to accept invitation', error);
      toast.error('Failed to accept invitation. Please try again.');
    },
  });
}
