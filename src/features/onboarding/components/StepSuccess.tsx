/**
 * Step 3: Success Screen
 * Creates agent with real-time progress, then shows brief celebration before auto-transition to Studio
 * The Setup Checklist in Studio handles KB, testing, and connecting.
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
import { Card } from './shared/Card';
import { useAnalytics } from '@/lib/analytics';

interface StepSuccessProps {
  onReadyChange: (isReady: boolean) => void;
  agentName: string;
  selectedPurposes: AgentPurpose[];
}

type CreationPhase = 'creating-agent' | 'ready' | 'error';

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

export const StepSuccess = ({ onReadyChange, agentName, selectedPurposes }: StepSuccessProps) => {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const { setCreatedAgentId } = useOnboardingStore();
  const hasTriggeredCreation = useRef(false);
  const isMountedRef = useRef(false);
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [phase, setPhase] = useState<CreationPhase>('creating-agent');
  const [agentStatus, setAgentStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
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

  // Create mutation
  const mutation = useOnboardingAgentMutation({
    onSuccess: (data) => {
      console.log('[Onboarding] 🎉 Agent created successfully!');

      setAgentStatus('success');
      setCreatedAgentId(data.agent.id);
      setPhase('ready');
      onReadyChange(true);

      // Track agent creation
      track('agent_created', {
        agentId: data.agent.id,
        agentName: agentName,
        userId: data.agent.organization_id,
      });

      // Brief confetti celebration
      setShowConfetti(true);
      safeSetTimeout(() => setShowConfetti(false), ANIMATION_TIMINGS.CONFETTI_DURATION);
    },
    onError: () => {
      setAgentStatus('error');
      setPhase('error');
    },
  });

  // Set mounted flag
  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  // Cleanup on unmount
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
    setPhase('creating-agent');
    setAgentStatus('loading');

    mutation.mutate({
      name: agentName,
      selectedPurposes,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retry handler
  const handleRetry = () => {
    setAgentStatus('pending');
    setPhase('creating-agent');

    mutation.mutate({
      name: agentName,
      selectedPurposes,
    });
  };

  // Render status icon
  const StatusIcon = ({ state, stepNumber }: { state: 'pending' | 'loading' | 'success' | 'error', stepNumber?: number }) => {
    switch (state) {
      case 'loading':
        return (
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
        );
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorCircleIcon />;
      default:
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

      {/* Content */}
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

        {/* Agent Creation Progress */}
        <Card className="mb-20">
          <div className="space-y-4">
            {/* Step 1: Agent Creation */}
            <div className="flex items-center gap-3">
              <StatusIcon state={agentStatus} stepNumber={1} />
              <span className={`text-sm transition-colors duration-300 ${agentStatus === 'loading' ? 'text-neutral-900 font-medium' : agentStatus === 'success' ? 'text-green-700' : agentStatus === 'error' ? 'text-red-700' : 'text-neutral-500'}`}>
                {agentStatus === 'loading' ? t('onboarding.step_success.agent_creating') : agentStatus === 'success' ? t('onboarding.step_success.agent_success') : agentStatus === 'error' ? t('onboarding.step_success.agent_error') : t('onboarding.step_success.agent_pending')}
              </span>
            </div>

            {/* Step 2: Ready */}
            <div className="flex items-center gap-3">
              <StatusIcon
                state={agentStatus === 'success' ? 'success' : 'pending'}
                stepNumber={2}
              />
              <span className={`text-sm transition-colors duration-300 ${
                agentStatus === 'success' ? 'text-green-700' : 'text-neutral-500'
              }`}>
                {agentStatus === 'success'
                  ? t('onboarding.step_success.ready_success')
                  : t('onboarding.step_success.ready_pending')}
              </span>
            </div>
          </div>
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
