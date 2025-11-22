/**
 * Onboarding Agent Creation Mutation
 * React Query mutation for creating agent and knowledge base during onboarding
 * Prevents double creation issues with StrictMode
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { agentService } from '@/features/agents/services/agentService';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/lib/logger';
import type { AgentPurpose } from '../types/onboarding.types';
import type { Agent, KnowledgeBase } from '@/features/agents/types/agent.types';

interface CreateOnboardingAgentParams {
  name: string;
  selectedPurposes: AgentPurpose[];
  knowledgeContent: string;
}

interface CreateOnboardingAgentResult {
  agent: Agent;
  knowledgeBase: KnowledgeBase | null;
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

      // Step 1: Create agent
      const personaPrompt = params.selectedPurposes
        .map((purpose) => purpose.prompt)
        .join('\n\n');

      const agent = await agentService.createAgent({
        name: params.name,
        personaPrompt,
      });

      logger.info('✅ Agent created', { agentId: agent.id });

      // Step 2: Add to store and select globally
      addAgent(agent);
      setGlobalSelectedAgent(agent);

      // Step 3: Create knowledge base if content exists
      let knowledgeBase: KnowledgeBase | null = null;
      if (params.knowledgeContent.trim()) {
        logger.info('📚 Creating knowledge base', { agentId: agent.id });

        try {
          knowledgeBase = await agentService.createKnowledgeBase({
            name: `${params.name} Knowledge Base`,
            content: params.knowledgeContent,
          });

          // Link KB to agent
          await agentService.linkKnowledgeBase(agent.id, knowledgeBase.id);

          logger.info('✅ Knowledge base created and linked', { knowledgeBaseId: knowledgeBase.id });
        } catch (kbError) {
          logger.error('❌ Knowledge base creation failed', kbError instanceof Error ? kbError : new Error(String(kbError)));
          // Don't fail the whole mutation - agent was created successfully
          toast.warning('Agent created, but knowledge base failed. You can add it later.');
        }
      }

      return { agent, knowledgeBase };
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
