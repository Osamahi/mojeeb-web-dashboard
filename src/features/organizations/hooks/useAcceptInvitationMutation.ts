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
import { authService } from '@/features/auth/services/authService';
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
        // 1. Refresh user profile to get new organization
        logger.info('[useAcceptInvitationMutation] Step 1/5: Refreshing user profile');
        await authService.getCurrentUser();

        // 2. Clear selected conversation (from old org)
        logger.info('[useAcceptInvitationMutation] Step 2/5: Clearing conversation selection');
        useConversationStore.getState().selectConversation(null);

        // 3. Fetch and set new organization's agents
        logger.info('[useAcceptInvitationMutation] Step 3/5: Fetching new agents');
        const agents = await agentService.getAgents();
        useAgentStore.getState().setAgents(agents);
        useAgentStore.getState().initializeAgentSelection();

        // 4. Invalidate all organization-scoped queries
        logger.info('[useAcceptInvitationMutation] Step 4/5: Invalidating queries');
        await refreshOrganizationData(queryClient);

        // 5. Clear pending invitations from store
        logger.info('[useAcceptInvitationMutation] Step 5/5: Clearing invitations');
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
