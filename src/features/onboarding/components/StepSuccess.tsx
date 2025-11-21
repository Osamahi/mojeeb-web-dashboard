/**
 * Step 4: Success Screen
 * Celebration screen with confetti and KB creation before redirect
 */

import { useEffect, useState } from 'react';
import { useOnboardingStore } from '../stores/onboardingStore';
import { agentService } from '@/features/agents/services/agentService';
import Confetti from 'react-confetti';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface StepSuccessProps {
  onComplete: () => void;
  agentId: string | null;
  agentName: string;
  knowledgeContent: string;
}

type ProgressPhase = 'agent' | 'knowledge' | 'redirecting' | 'complete';

export const StepSuccess = ({ onComplete, agentId, agentName, knowledgeContent }: StepSuccessProps) => {
  const { data } = useOnboardingStore();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [phase, setPhase] = useState<ProgressPhase>('agent');
  const [kbError, setKbError] = useState<string | null>(null);

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

  // Main onboarding completion flow with 3 phases (5 seconds total)
  useEffect(() => {
    let mounted = true;

    const completeOnboarding = async () => {
      try {
        // Phase 1: Show "Agent created" for 1 second
        logger.info('🎉 StepSuccess Phase 1: Agent created celebration');
        setPhase('agent');
        await sleep(1000);

        if (!mounted) return;

        // Phase 2: Create knowledge base if content exists (3 seconds)
        if (knowledgeContent && knowledgeContent.trim() && agentId) {
          logger.info('📚 StepSuccess Phase 2: Creating knowledge base');
          setPhase('knowledge');

          const kbStartTime = Date.now();

          try {
            // 10-second timeout for KB creation
            await Promise.race([
              createKnowledgeBase(agentId, agentName, knowledgeContent),
              timeout(10000, 'Knowledge base creation timed out')
            ]);

            if (!mounted) return;
            logger.info('✅ Knowledge base created successfully');
          } catch (kbError) {
            // Don't fail onboarding if KB creation fails
            logger.error('❌ Knowledge base creation failed:', kbError);
            const errorMsg = (kbError as any)?.response?.data?.message || (kbError as Error)?.message || 'Unknown error';
            setKbError(errorMsg);
            toast.warning('Agent created successfully, but knowledge base failed. You can add it later from Studio.');
          }

          // Ensure this phase takes at least 3 seconds total
          const kbElapsed = Date.now() - kbStartTime;
          const remainingKbTime = Math.max(0, 3000 - kbElapsed);
          if (remainingKbTime > 0) {
            await sleep(remainingKbTime);
          }
        } else {
          // No knowledge content - show empty phase for 3 seconds
          logger.info('⏭️  No knowledge content, skipping KB creation');
          await sleep(3000);
        }

        if (!mounted) return;

        // Phase 3: Show "Redirecting..." for 1 second
        logger.info('🔄 StepSuccess Phase 3: Preparing redirect');
        setPhase('redirecting');
        await sleep(1000);

        if (!mounted) return;

        // Phase 4: Complete and redirect
        logger.info('✅ StepSuccess Phase 4: Completing onboarding');
        setPhase('complete');
        onComplete();

      } catch (error) {
        logger.error('❌ Unexpected error in onboarding completion:', error);
        // Still redirect even on error
        if (mounted) {
          await sleep(1000);
          onComplete();
        }
      }
    };

    completeOnboarding();

    return () => {
      mounted = false;
    };
  }, [onComplete, agentId, agentName, knowledgeContent]);

  // Helper: Create KB with proper error handling
  const createKnowledgeBase = async (agentId: string, agentName: string, content: string) => {
    logger.info('Creating knowledge base for agent:', agentId);

    const kb = await agentService.createKnowledgeBase({
      name: `${agentName} Knowledge Base`,
      content: content,
    });

    // Link knowledge base to agent
    await agentService.linkKnowledgeBase(agentId, kb.id);
    logger.info('Knowledge base linked successfully');
  };

  // Helper: Sleep utility
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper: Timeout utility
  const timeout = (ms: number, message: string) =>
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

  // Render progress message based on phase
  const renderProgressMessage = () => {
    switch (phase) {
      case 'agent':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg text-sm text-green-700 mb-8">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Agent created successfully
          </div>
        );

      case 'knowledge':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700 mb-8">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-blue-700 rounded-full animate-spin" />
            Adding knowledge base...
          </div>
        );

      case 'redirecting':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-lg text-sm text-neutral-700 mb-8">
            <div className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-900 rounded-full animate-spin" />
            Redirecting to dashboard...
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Confetti */}
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.3}
      />

      {/* Success content - mobile-first, left-aligned */}
      <div className="w-full">
        {/* Success icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-950 mb-3 tracking-tight">
          You're all set!
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 mb-8">
          {agentName} is ready to help your customers
          {data.selectedPurposes.length > 0 && (
            <span className="block text-sm text-neutral-500 mt-2">
              Specialized in: {data.selectedPurposes.map((p) => p.label).join(', ')}
            </span>
          )}
        </p>

        {/* Dynamic progress message */}
        {renderProgressMessage()}

        {/* Error message if KB creation failed */}
        {kbError && (
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg text-sm text-yellow-700 mb-8">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Knowledge base setup incomplete
          </div>
        )}

        {/* What's Next - compact */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">
            What's Next?
          </h2>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Customize your agent's appearance</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Add more knowledge to improve responses</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Install the chat widget on your website</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Start your first conversation</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};
