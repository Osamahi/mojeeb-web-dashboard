/**
 * Onboarding Agent Creation Mutation
 * React Query mutation for creating agent during onboarding
 * Knowledge base is handled separately via the Setup Checklist in Studio
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { agentService } from '@/features/agents/services/agentService';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/lib/logger';
import type { AgentPurpose } from '../types/onboarding.types';
import type { Agent } from '@/features/agents/types/agent.types';
import { buildMultiRolePersona } from '../utils/buildMultiRolePersona';

interface CreateOnboardingAgentParams {
  name: string;
  selectedPurposes: AgentPurpose[];
}

interface CreateOnboardingAgentResult {
  agent: Agent;
}

interface UseOnboardingAgentMutationOptions {
  onSuccess?: (data: CreateOnboardingAgentResult) => void;
  onError?: (error: Error) => void;
}

export const useOnboardingAgentMutation = (options?: UseOnboardingAgentMutationOptions) => {
  const queryClient = useQueryClient();
  const setGlobalSelectedAgent = useAgentStore((state) => state.setGlobalSelectedAgent);

  return useMutation<CreateOnboardingAgentResult, Error, CreateOnboardingAgentParams>({
    mutationFn: async (params: CreateOnboardingAgentParams) => {
      logger.info('🚀 Creating agent', { agentName: params.name });

      // Fuse the selected purpose roles into one concise sentence.
      // Example: "You are a customer support, social media moderator agent."
      const personaPrompt = buildMultiRolePersona(params.selectedPurposes);

      const agent = await agentService.createAgent({
        name: params.name,
        personaPrompt,
      });

      logger.info('✅ Agent created', { agentId: agent.id });

      // Select the new agent globally so the dashboard renders it on next paint.
      // The agents-list cache lives in React Query (useInfiniteAgents) and is
      // invalidated below so consumers pick up the new agent.
      setGlobalSelectedAgent(agent);

      return { agent };
    },
    onSuccess: (data) => {
      // Invalidate ALL agents queries (flat + cursor-paginated views) so any
      // open agent list refetches and shows the newly created agent.
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      toast.success('Agent created successfully!');

      // Call optional success callback
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      logger.error('❌ Agent creation failed', error);

      // Extract error message safely
      let errorMsg = 'Unknown error';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMsg = String(error.message);
      }

      toast.error(`Failed to create agent: ${errorMsg}`);

      // Call optional error callback
      options?.onError?.(error);
    },
  });
};
