/**
 * Step 4: Success Screen
 * Creates agent and KB with real-time progress, then shows completion with manual redirect
 */

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOnboardingStore } from '../stores/onboardingStore';
import { agentService } from '@/features/agents/services/agentService';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { queryKeys } from '@/lib/queryKeys';
import Confetti from 'react-confetti';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { AgentPurpose } from '../types/onboarding.types';

interface StepSuccessProps {
  onComplete: () => void;
  onReadyChange: (isReady: boolean) => void;
  agentName: string;
  selectedPurposes: AgentPurpose[];
  knowledgeContent: string;
}

type CreationPhase = 'creating-agent' | 'adding-knowledge' | 'ready' | 'error';

interface PhaseStatus {
  agent: 'pending' | 'loading' | 'success' | 'error';
  knowledge: 'pending' | 'loading' | 'success' | 'error' | 'skipped';
}

export const StepSuccess = ({ onComplete, onReadyChange, agentName, selectedPurposes, knowledgeContent }: StepSuccessProps) => {
  const queryClient = useQueryClient();
  const { setCreatedAgentId } = useOnboardingStore();
  const addAgent = useAgentStore((state) => state.addAgent);
  const setGlobalSelectedAgent = useAgentStore((state) => state.setGlobalSelectedAgent);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [phase, setPhase] = useState<CreationPhase>('creating-agent');
  const [status, setStatus] = useState<PhaseStatus>({
    agent: 'pending',
    knowledge: knowledgeContent.trim() ? 'pending' : 'skipped',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdAgentId, setLocalCreatedAgentId] = useState<string | null>(null);

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main creation flow
  useEffect(() => {
    let mounted = true;

    const runCreationFlow = async () => {
      try {
        // Phase 1: Create Agent
        logger.info('🚀 Creating agent:', agentName);
        setPhase('creating-agent');
        setStatus(prev => ({ ...prev, agent: 'loading' }));

        const personaPrompt = selectedPurposes
          .map((purpose) => purpose.prompt)
          .join('\n\n');

        const agent = await agentService.createAgent({
          name: agentName,
          personaPrompt,
        });

        if (!mounted) return;

        logger.info('✅ Agent created:', agent.id);
        setStatus(prev => ({ ...prev, agent: 'success' }));
        setLocalCreatedAgentId(agent.id);
        setCreatedAgentId(agent.id);

        // Add to store and select
        addAgent(agent);
        setGlobalSelectedAgent(agent);

        // Phase 2: Create Knowledge Base (if content exists)
        if (knowledgeContent.trim()) {
          logger.info('📚 Creating knowledge base...');
          setPhase('adding-knowledge');
          setStatus(prev => ({ ...prev, knowledge: 'loading' }));

          try {
            const kb = await agentService.createKnowledgeBase({
              name: `${agentName} Knowledge Base`,
              content: knowledgeContent,
            });

            if (!mounted) return;

            // Link KB to agent
            await agentService.linkKnowledgeBase(agent.id, kb.id);

            if (!mounted) return;

            logger.info('✅ Knowledge base created and linked');
            setStatus(prev => ({ ...prev, knowledge: 'success' }));
          } catch (kbError) {
            logger.error('❌ Knowledge base creation failed:', kbError);
            setStatus(prev => ({ ...prev, knowledge: 'error' }));
            toast.warning('Agent created, but knowledge base failed. You can add it later.');
            // Don't fail the whole flow - continue to ready state
          }
        }

        if (!mounted) return;

        // Phase 3: Ready!
        setPhase('ready');
        onReadyChange(true);

        // Invalidate queries so dashboard has fresh data
        queryClient.invalidateQueries({ queryKey: queryKeys.agents() });

      } catch (error) {
        logger.error('❌ Agent creation failed:', error);
        if (!mounted) return;

        const errorMsg = (error as any)?.response?.data?.message || (error as Error)?.message || 'Unknown error';
        setErrorMessage(errorMsg);
        setStatus(prev => ({ ...prev, agent: 'error' }));
        setPhase('error');
        toast.error(`Failed to create agent: ${errorMsg}`);
      }
    };

    runCreationFlow();

    return () => {
      mounted = false;
    };
  }, [agentName, selectedPurposes, knowledgeContent, addAgent, setGlobalSelectedAgent, setCreatedAgentId, queryClient, onReadyChange]);

  // Retry handler
  const handleRetry = () => {
    setErrorMessage(null);
    setStatus({
      agent: 'pending',
      knowledge: knowledgeContent.trim() ? 'pending' : 'skipped',
    });
    setPhase('creating-agent');
    // Trigger re-run by changing a dependency (using key in parent would be cleaner but this works)
    window.location.reload();
  };

  // Render status icon
  const StatusIcon = ({ state }: { state: 'pending' | 'loading' | 'success' | 'error' | 'skipped' }) => {
    switch (state) {
      case 'loading':
        return (
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'skipped':
        return (
          <svg className="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        );
      default: // pending
        return (
          <div className="w-5 h-5 rounded-full border-2 border-neutral-300" />
        );
    }
  };

  return (
    <>
      {/* Confetti - only show when ready */}
      {phase === 'ready' && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      {/* Content - same structure as other steps */}
      <div className="w-full">
        {/* Title - matching other steps */}
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-950 mb-2 tracking-tight">
          {phase === 'ready' ? "You're all set!" : phase === 'error' ? 'Something went wrong' : 'Setting up your agent...'}
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 mb-8">
          {phase === 'ready'
            ? `${agentName} is ready to help your customers`
            : phase === 'error'
            ? 'We encountered an error while creating your agent'
            : `Creating ${agentName}...`
          }
        </p>

        {/* Progress Steps & Next Steps - Combined */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-20">
          <div className="space-y-4">
            {/* Step 1: Agent Creation */}
            <div className="flex items-center gap-3">
              <StatusIcon state={status.agent} />
              <span className={`text-sm ${status.agent === 'loading' ? 'text-neutral-900 font-medium' : status.agent === 'success' ? 'text-green-700' : status.agent === 'error' ? 'text-red-700' : 'text-neutral-500'}`}>
                {status.agent === 'loading' ? 'Creating agent...' : status.agent === 'success' ? '✨ Your agent was created successfully' : status.agent === 'error' ? 'Failed to create agent' : 'Create agent'}
              </span>
            </div>

            {/* Step 2: Knowledge Base */}
            <div className="flex items-center gap-3">
              <StatusIcon state={status.knowledge} />
              <span className={`text-sm ${status.knowledge === 'loading' ? 'text-neutral-900 font-medium' : status.knowledge === 'success' ? 'text-green-700' : status.knowledge === 'error' ? 'text-yellow-700' : status.knowledge === 'skipped' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {status.knowledge === 'loading' ? 'Adding knowledge base...' : status.knowledge === 'success' ? '📚 Your knowledge has been added' : status.knowledge === 'error' ? 'Knowledge base failed (can add later)' : status.knowledge === 'skipped' ? 'No knowledge to add' : 'Add knowledge base'}
              </span>
            </div>

            {/* Step 3: Ready */}
            <div className="flex items-center gap-3">
              <StatusIcon state={phase === 'ready' ? 'success' : 'pending'} />
              <span className={`text-sm ${phase === 'ready' ? 'text-green-700' : 'text-neutral-500'}`}>
                {phase === 'ready' ? '🎉 Your agent is now fully ready' : 'Finishing up'}
              </span>
            </div>
          </div>

          {/* Next Steps - animate in when ready */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${
              phase === 'ready' ? 'max-h-96 opacity-100 mt-6 pt-5 border-t border-neutral-100' : 'max-h-0 opacity-0'
            }`}
          >
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">Next Steps</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-neutral-600">
                <span className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">4</span>
                💬 Try your agent now
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-600">
                <span className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">5</span>
                🎓 Add more knowledge anytime
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-600">
                <span className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">6</span>
                🔗 Connect it to Facebook, Instagram, your website & more
              </li>
            </ul>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-3 text-sm text-red-700 underline hover:text-red-900"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </>
  );
};
