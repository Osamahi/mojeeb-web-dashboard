/**
 * Step 4: Success Screen
 * Creates agent and KB with real-time progress, then shows completion with manual redirect
 */

import { useEffect, useState, useRef } from 'react';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useOnboardingAgentMutation } from '../hooks/useOnboardingAgentMutation';
import Confetti from 'react-confetti';
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
  const { setCreatedAgentId } = useOnboardingStore();
  const hasTriggeredCreation = useRef(false);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [phase, setPhase] = useState<CreationPhase>('creating-agent');
  const [status, setStatus] = useState<PhaseStatus>({
    agent: 'pending',
    knowledge: 'pending', // Always start pending, will change to skipped with animation if no content
  });

  // Animation states for Next Steps reveal (4, 5, 6)
  const [showNextStep4, setShowNextStep4] = useState(false);
  const [showNextStep5, setShowNextStep5] = useState(false);
  const [showNextStep6, setShowNextStep6] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Create mutation with success/error callbacks
  const mutation = useOnboardingAgentMutation({
    onSuccess: (data) => {
      console.log('✅ SUCCESS CALLBACK - Updating UI state', data);

      const hasKnowledge = knowledgeContent.trim().length > 0;
      const kbStatus = data.knowledgeBase
        ? 'success'
        : hasKnowledge ? 'error' : 'skipped';

      console.log('📊 STATE UPDATE - Setting status', {
        agent: 'success',
        knowledge: kbStatus,
        agentId: data.agent.id,
      });

      // Update status and agent ID
      setStatus({ agent: 'success', knowledge: kbStatus });
      setCreatedAgentId(data.agent.id);

      // Sequence phase transitions properly with timing
      if (hasKnowledge) {
        console.log('📚 HAS KNOWLEDGE - Setting adding-knowledge phase');
        setPhase('adding-knowledge');

        // Wait 800ms to show KB phase, then transition to ready
        setTimeout(() => {
          console.log('🎉 TRANSITIONING TO READY PHASE (with KB)');
          setPhase('ready');
          onReadyChange(true);

          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 1500);

          setTimeout(() => {
            console.log('🔢 Showing Next Step 4');
            setShowNextStep4(true);
          }, 500);
          setTimeout(() => {
            console.log('🔢 Showing Next Step 5');
            setShowNextStep5(true);
          }, 1000);
          setTimeout(() => {
            console.log('🔢 Showing Next Step 6');
            setShowNextStep6(true);
          }, 1500);
        }, 800);
      } else {
        console.log('⚡ NO KNOWLEDGE - Going straight to ready phase');
        setPhase('ready');
        onReadyChange(true);

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1500);

        setTimeout(() => {
          console.log('🔢 Showing Next Step 4');
          setShowNextStep4(true);
        }, 500);
        setTimeout(() => {
          console.log('🔢 Showing Next Step 5');
          setShowNextStep5(true);
        }, 1000);
        setTimeout(() => {
          console.log('🔢 Showing Next Step 6');
          setShowNextStep6(true);
        }, 1500);
      }
    },
    onError: (error) => {
      console.log('❌ ERROR CALLBACK - Setting error state', error);
      setStatus({ agent: 'error', knowledge: 'pending' });
      setPhase('error');
    },
  });

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

  // Trigger agent creation on mount (only once)
  useEffect(() => {
    console.log('🚀 TRIGGER EFFECT RUNNING', {
      hasTriggered: hasTriggeredCreation.current,
      agentName,
      purposesCount: selectedPurposes.length,
      hasKnowledge: knowledgeContent.trim().length > 0,
    });

    if (hasTriggeredCreation.current) {
      console.log('⏭️ SKIPPING - Already triggered');
      return;
    }

    hasTriggeredCreation.current = true;
    console.log('▶️ TRIGGERING MUTATION - Setting loading state');

    // Set loading state immediately
    setPhase('creating-agent');
    setStatus({ agent: 'loading', knowledge: 'pending' });

    // Trigger the mutation
    mutation.mutate({
      name: agentName,
      selectedPurposes,
      knowledgeContent,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - mutation.mutate is stable

  // Retry handler
  const handleRetry = () => {

    setStatus({
      agent: 'pending',
      knowledge: 'pending',
    });
    setShowNextStep4(false);
    setShowNextStep5(false);
    setShowNextStep6(false);
    setPhase('creating-agent');

    // Retry the mutation
    mutation.mutate({
      name: agentName,
      selectedPurposes,
      knowledgeContent,
    });
  };

  // Render status icon with step number
  const StatusIcon = ({ state, stepNumber }: { state: 'pending' | 'loading' | 'success' | 'error' | 'skipped', stepNumber?: number }) => {
    switch (state) {
      case 'loading':
        return (
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
        );
      case 'success':
      case 'skipped': // Skipped also shows green checkmark
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
      default: // pending - show step number
        return (
          <span className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">
            {stepNumber}
          </span>
        );
    }
  };

  return (
    <>
      {/* Confetti - brief burst */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={100}
          gravity={0.4}
        />
      )}

      {/* Content - same structure as other steps */}
      <div className="w-full">
        {/* Title - matching other steps */}
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-950 mb-2 tracking-tight">
          {phase === 'ready' ? "Congratulations!" : phase === 'error' ? 'Something went wrong' : 'Setting up your agent...'}
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 mb-8">
          {phase === 'ready'
            ? 'Your agent is ready to help customers'
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
              <StatusIcon state={status.agent} stepNumber={1} />
              <span className={`text-sm transition-colors duration-300 ${status.agent === 'loading' ? 'text-neutral-900 font-medium' : status.agent === 'success' ? 'text-green-700' : status.agent === 'error' ? 'text-red-700' : 'text-neutral-500'}`}>
                {status.agent === 'loading' ? 'Creating agent...' : status.agent === 'success' ? '✨ Your agent was created successfully' : status.agent === 'error' ? 'Failed to create agent' : 'Create agent'}
              </span>
            </div>

            {/* Step 2: Knowledge Base */}
            <div className="flex items-center gap-3">
              <StatusIcon state={status.knowledge} stepNumber={2} />
              <span className={`text-sm transition-colors duration-300 ${status.knowledge === 'loading' ? 'text-neutral-900 font-medium' : status.knowledge === 'success' ? 'text-green-700' : status.knowledge === 'error' ? 'text-yellow-700' : status.knowledge === 'skipped' ? 'text-green-700' : 'text-neutral-500'}`}>
                {status.knowledge === 'loading' ? 'Adding knowledge base...' : status.knowledge === 'success' ? '📚 Your knowledge has been added' : status.knowledge === 'error' ? 'Knowledge base failed (can add later)' : status.knowledge === 'skipped' ? '📚 Knowledge to be added later' : 'Add knowledge base'}
              </span>
            </div>

            {/* Step 3: Ready */}
            <div className="flex items-center gap-3">
              <StatusIcon state={phase === 'ready' ? 'success' : 'pending'} stepNumber={3} />
              <span className={`text-sm transition-colors duration-300 ${phase === 'ready' ? 'text-green-700' : 'text-neutral-500'}`}>
                {phase === 'ready' ? '🎉 Your agent is now fully ready' : 'Finishing up'}
              </span>
            </div>
          </div>

          {/* Next Steps - animate in sequentially when ready */}
          {phase === 'ready' && (
            <div className="mt-6">
              <h3 className={`text-sm font-semibold text-neutral-900 mb-4 transition-all duration-500 ${showNextStep4 ? 'opacity-100' : 'opacity-0'}`}>Next Steps:</h3>
              <ul className="space-y-3">
                {/* Step 4 */}
                <li className={`flex items-center gap-3 text-sm text-neutral-600 transition-all duration-[600ms] ${showNextStep4 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-3 scale-95'}`} style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <span className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">4</span>
                  💬 Try your agent now
                </li>
                {/* Step 5 */}
                <li className={`flex items-center gap-3 text-sm text-neutral-600 transition-all duration-[600ms] ${showNextStep5 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-3 scale-95'}`} style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <span className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">5</span>
                  🎓 Add more knowledge anytime
                </li>
                {/* Step 6 */}
                <li className={`flex items-center gap-3 text-sm text-neutral-600 transition-all duration-[600ms] ${showNextStep6 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-3 scale-95'}`} style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <span className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">6</span>
                  🔗 Connect it to Facebook, Instagram, your website & more
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Error Message */}
        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              {(mutation.error as any)?.response?.data?.message || mutation.error?.message || 'Failed to create agent'}
            </p>
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
