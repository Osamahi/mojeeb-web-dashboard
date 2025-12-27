/**
 * Step 4: Success Screen
 * Creates agent and KB with real-time progress, then shows completion with manual redirect
 */

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useOnboardingAgentMutation } from '../hooks/useOnboardingAgentMutation';
import { ANIMATION_TIMINGS } from '../constants/timings';
import Confetti from 'react-confetti';
import type { AgentPurpose } from '../types/onboarding.types';
import { CheckCircleIcon, ErrorCircleIcon } from '@/shared/components/icons';
import { StepHeading, StepSubtitle } from './shared/StepHeading';
import { StepNumberBadge } from './shared/StepNumberBadge';
import { NextStepItem } from './shared/NextStepItem';
import { Card } from './shared/Card';
import { trackAgentCreated } from '@/utils/gtmTracking';

interface StepSuccessProps {
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

// Type-safe error message extractor
const getErrorMessage = (error: unknown, t: (key: string) => string): string => {
  if (!error) return t('onboarding.step_success.error_default');

  // Check for axios-style error response
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    // Try to get response.data.message
    if ('response' in err &&
        typeof err.response === 'object' &&
        err.response !== null) {
      const response = err.response as Record<string, unknown>;

      if ('data' in response &&
          typeof response.data === 'object' &&
          response.data !== null) {
        const data = response.data as Record<string, unknown>;

        if ('message' in data && typeof data.message === 'string') {
          return data.message;
        }
      }
    }

    // Try to get error.message
    if ('message' in err && typeof err.message === 'string') {
      return err.message;
    }
  }

  return t('onboarding.step_success.error_default');
};

export const StepSuccess = ({ onReadyChange, agentName, selectedPurposes, knowledgeContent }: StepSuccessProps) => {
  const { t } = useTranslation();
  const { setCreatedAgentId } = useOnboardingStore();
  const hasTriggeredCreation = useRef(false);
  const isMountedRef = useRef(false); // Track component lifecycle - starts false, set to true after mount
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]); // Track all timeouts for cleanup

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

  // Safe setTimeout that only executes if component is still mounted
  const safeSetTimeout = (callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        callback();
      }
    }, delay);
    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  };

  // Create mutation with success/error callbacks
  const mutation = useOnboardingAgentMutation({
    onProgress: (phase) => {
      // Update UI state in real-time as mutation progresses
      switch (phase) {
        case 'agent-created':
          setStatus({ agent: 'success', knowledge: 'pending' });
          break;
        case 'creating-knowledge':
          setStatus({ agent: 'success', knowledge: 'loading' });
          break;
        case 'knowledge-created':
          setStatus({ agent: 'success', knowledge: 'success' });
          break;
        case 'knowledge-skipped':
          setStatus({ agent: 'success', knowledge: 'skipped' });
          break;
        case 'knowledge-failed':
          setStatus({ agent: 'success', knowledge: 'error' });
          break;
      }
    },
    onSuccess: (data) => {
      // Status is already set by onProgress - just handle final "ready" state
      setCreatedAgentId(data.agent.id);
      setPhase('ready');
      onReadyChange(true);

      // Track agent creation success in Google Tag Manager
      trackAgentCreated(data.agent.id, agentName);

      // Visual effects only (can safely be canceled on unmount)
      setShowConfetti(true);
      safeSetTimeout(() => setShowConfetti(false), ANIMATION_TIMINGS.CONFETTI_DURATION);

      // ✅ Trigger Next Steps animations with stagger timing
      // Using safeSetTimeout ensures proper cleanup on unmount
      // requestAnimationFrame ensures animations trigger on next frame
      requestAnimationFrame(() => {
        safeSetTimeout(() => setShowNextStep4(true), ANIMATION_TIMINGS.NEXT_STEP_OFFSET_1);
        safeSetTimeout(() => setShowNextStep5(true), ANIMATION_TIMINGS.NEXT_STEP_OFFSET_2);
        safeSetTimeout(() => setShowNextStep6(true), ANIMATION_TIMINGS.NEXT_STEP_OFFSET_3);
      });
    },
    onError: () => {
      setStatus({ agent: 'error', knowledge: 'pending' });
      setPhase('error');
    },
  });

  // Set mounted flag to true after mount
  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  // Cleanup on unmount - clear all timeouts and mark as unmounted
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
    };
  }, []);

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
    if (hasTriggeredCreation.current) {
      return;
    }

    hasTriggeredCreation.current = true;

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
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorCircleIcon />;
      default: // pending - show step number
        return <StepNumberBadge number={stepNumber!} />;
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
        <StepHeading>
          {phase === 'ready' ? t('onboarding.step_success.heading_ready') : phase === 'error' ? t('onboarding.step_success.heading_error') : t('onboarding.step_success.heading_creating')}
        </StepHeading>
        <StepSubtitle>
          {phase === 'ready'
            ? t('onboarding.step_success.subtitle_ready')
            : phase === 'error'
            ? t('onboarding.step_success.subtitle_error')
            : t('onboarding.step_success.subtitle_creating', { agentName })
          }
        </StepSubtitle>

        {/* Progress Steps & Next Steps - Combined */}
        <Card className="mb-20">
          <div className="space-y-4">
            {/* Step 1: Agent Creation */}
            <div className="flex items-center gap-3">
              <StatusIcon state={status.agent} stepNumber={1} />
              <span className={`text-sm transition-colors duration-300 ${status.agent === 'loading' ? 'text-neutral-900 font-medium' : status.agent === 'success' ? 'text-green-700' : status.agent === 'error' ? 'text-red-700' : 'text-neutral-500'}`}>
                {status.agent === 'loading' ? t('onboarding.step_success.agent_creating') : status.agent === 'success' ? t('onboarding.step_success.agent_success') : status.agent === 'error' ? t('onboarding.step_success.agent_error') : t('onboarding.step_success.agent_pending')}
              </span>
            </div>

            {/* Step 2: Knowledge Base */}
            <div className="flex items-center gap-3">
              <StatusIcon state={status.knowledge} stepNumber={2} />
              <span className={`text-sm transition-colors duration-300 ${status.knowledge === 'loading' ? 'text-neutral-900 font-medium' : status.knowledge === 'success' ? 'text-green-700' : status.knowledge === 'error' ? 'text-yellow-700' : status.knowledge === 'skipped' ? 'text-green-700' : 'text-neutral-500'}`}>
                {status.knowledge === 'loading' ? t('onboarding.step_success.kb_creating') : status.knowledge === 'success' ? t('onboarding.step_success.kb_success') : status.knowledge === 'error' ? t('onboarding.step_success.kb_error') : status.knowledge === 'skipped' ? t('onboarding.step_success.kb_skipped') : t('onboarding.step_success.kb_pending')}
              </span>
            </div>

            {/* Step 3: Ready */}
            <div className="flex items-center gap-3">
              <StatusIcon
                state={
                  status.agent === 'success' &&
                  status.knowledge !== 'pending' &&
                  status.knowledge !== 'loading'
                    ? 'success'
                    : 'pending'
                }
                stepNumber={3}
              />
              <span className={`text-sm transition-colors duration-300 ${
                status.agent === 'success' &&
                status.knowledge !== 'pending' &&
                status.knowledge !== 'loading'
                  ? 'text-green-700'
                  : 'text-neutral-500'
              }`}>
                {status.agent === 'success' &&
                 status.knowledge !== 'pending' &&
                 status.knowledge !== 'loading'
                  ? t('onboarding.step_success.ready_success')
                  : t('onboarding.step_success.ready_pending')}
              </span>
            </div>
          </div>

          {/* Next Steps - animate in sequentially when ready */}
          {phase === 'ready' && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">{t('onboarding.step_success.next_steps_title')}</h3>
              <ul className="space-y-3">
                <NextStepItem
                  key={4}
                  stepNumber={4}
                  icon="💬"
                  text={t('onboarding.step_success.next_step_4')}
                  isVisible={showNextStep4}
                />
                <NextStepItem
                  key={5}
                  stepNumber={5}
                  icon="🎓"
                  text={t('onboarding.step_success.next_step_5')}
                  isVisible={showNextStep5}
                />
                <NextStepItem
                  key={6}
                  stepNumber={6}
                  icon="🔗"
                  text={t('onboarding.step_success.next_step_6')}
                  isVisible={showNextStep6}
                />
              </ul>
            </div>
          )}
        </Card>

        {/* Error Message */}
        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              {getErrorMessage(mutation.error, t)}
            </p>
            <button
              onClick={handleRetry}
              className="mt-3 text-sm text-red-700 underline hover:text-red-900"
            >
              {t('common.try_again')}
            </button>
          </div>
        )}
      </div>
    </>
  );
};
