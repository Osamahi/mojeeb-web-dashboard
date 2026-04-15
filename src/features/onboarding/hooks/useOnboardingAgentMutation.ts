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
  const addAgent = useAgentStore((state) => state.addAgent);
  const setGlobalSelectedAgent = useAgentStore((state) => state.setGlobalSelectedAgent);

  return useMutation<CreateOnboardingAgentResult, Error, CreateOnboardingAgentParams>({
    mutationFn: async (params: CreateOnboardingAgentParams) => {
      logger.info('🚀 Creating agent', { agentName: params.name });

      // Create agent with combined persona prompt
      const personaPrompt = params.selectedPurposes
        .map((purpose) => purpose.prompt)
        .join('\n\n');

      const agent = await agentService.createAgent({
        name: params.name,
        personaPrompt,
      });

      logger.info('✅ Agent created', { agentId: agent.id });

      // Add to store and select globally
      addAgent(agent);
      setGlobalSelectedAgent(agent);

      return { agent };
    },
    onSuccess: (data) => {
      // Invalidate queries so dashboard has fresh data
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
