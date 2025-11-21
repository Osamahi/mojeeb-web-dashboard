/**
 * Onboarding Wizard - Main Page
 * 4-step wizard to guide new users through creating their first agent
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useOnboardingStore } from '../stores/onboardingStore';
import { OnboardingStep } from '../types/onboarding.types';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { StepName } from '../components/StepName';
import { StepPurpose } from '../components/StepPurpose';
import { StepKnowledge } from '../components/StepKnowledge';
import { StepSuccess } from '../components/StepSuccess';
import { ExitIntentModal } from '../components/ExitIntentModal';
import { SimpleConfirmModal } from '../components/SimpleConfirmModal';
import { DemoCallModal } from '../components/DemoCallModal';
import { agentService } from '@/features/agents/services/agentService';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export const OnboardingWizard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentStep, nextStep, previousStep, setStep, data, setCreatedAgentId, completeOnboarding } = useOnboardingStore();
  const addAgent = useAgentStore((state) => state.addAgent);
  const setGlobalSelectedAgent = useAgentStore((state) => state.setGlobalSelectedAgent);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isSuccessReady, setIsSuccessReady] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoCallRequested, setDemoCallRequested] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState('');

  // Handle browser back button and exit intent
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (currentStep > OnboardingStep.Name && currentStep < OnboardingStep.Success) {
        setShowExitModal(true);
      } else if (currentStep === OnboardingStep.Name) {
        // Allow leaving from first step
        window.history.back();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show browser's native "are you sure" dialog when closing tab/window
      if (currentStep > OnboardingStep.Name && currentStep < OnboardingStep.Success) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentStep, previousStep]);

  const handleCreateAgent = async () => {
    setIsCreatingAgent(true);

    try {
      // Generate persona prompt from selected purposes
      const personaPrompt = data.selectedPurposes
        .map((purpose) => purpose.prompt)
        .join('\n\n');

      // Create the agent
      logger.info('Creating agent with name:', data.agentName);
      const agent = await agentService.createAgent({
        name: data.agentName,
        personaPrompt,
      });

      logger.info('Agent created successfully with ID:', agent.id);

      // Add the newly created agent to the agent store immediately
      // This ensures it's available when we try to switch to it after redirect
      addAgent(agent);

      // Pre-select the agent globally so it's ready before redirect
      // This eliminates the delay on the conversations page
      setGlobalSelectedAgent(agent);
      logger.info('Agent pre-selected globally:', agent.name);

      // Save the created agent ID to the store
      setCreatedAgentId(agent.id);

      toast.success('Agent created successfully!');

      // Advance to success step (KB creation will happen there)
      nextStep();
    } catch (error) {
      logger.error('Failed to create agent:', error);
      const errorMsg = (error as any)?.response?.data?.message || (error as Error)?.message || 'Unknown error';
      logger.error('Error details:', errorMsg);
      toast.error(`Failed to create agent: ${errorMsg}`);
      // Stay on current step on error - don't go back
      throw error; // Re-throw to be caught by caller
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handleStepComplete = () => {
    // All steps just advance to next - agent creation happens in Success step
    nextStep();
  };

  const handleSkipKnowledge = () => {
    // Skip knowledge and go to Success step - agent creation happens there
    nextStep();
  };

  const handleOnboardingComplete = () => {
    completeOnboarding();

    // CRITICAL: Invalidate React Query cache to force refetch on next mount
    // This ensures DashboardLayout gets fresh agents list including newly created agent
    queryClient.invalidateQueries({ queryKey: queryKeys.agents() });

    // Agent is already pre-selected globally, no need for URL param
    navigate('/conversations');
  };

  const handleExitModalContinue = () => {
    setShowExitModal(false);
  };

  const handleExitModalExit = () => {
    setShowExitModal(false);
    navigate('/');
  };

  const handleSkipClick = () => {
    setShowSkipModal(true);
  };

  const handleSkipConfirm = () => {
    setShowSkipModal(false);
    navigate('/conversations');
  };

  const handleSkipCancel = () => {
    setShowSkipModal(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case OnboardingStep.Name:
        return <StepName onNext={handleStepComplete} />;

      case OnboardingStep.Purpose:
        return (
          <StepPurpose
            onNext={handleStepComplete}
            onBack={previousStep}
          />
        );

      case OnboardingStep.Knowledge:
        return (
          <StepKnowledge
            onNext={handleStepComplete}
            onSkip={handleSkipKnowledge}
            onBack={previousStep}
          />
        );

      case OnboardingStep.Success:
        return (
          <StepSuccess
            onComplete={handleOnboardingComplete}
            onReadyChange={setIsSuccessReady}
            agentName={data.agentName}
            selectedPurposes={data.selectedPurposes}
            knowledgeContent={data.knowledgeContent}
          />
        );

      default:
        return null;
    }
  };

  // Check if current step can proceed (will be determined by each step component)
  const canProceed = (() => {
    switch (currentStep) {
      case OnboardingStep.Name:
        return data.agentName.trim().length >= 2;
      case OnboardingStep.Purpose:
        return data.selectedPurposes.length > 0;
      case OnboardingStep.Knowledge:
        return true; // Knowledge is optional
      default:
        return false;
    }
  })();

  const handleFABClick = () => {
    handleStepComplete();
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header - Minimal mobile-optimized */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* Logo */}
          <img
            src="/mojeeb-logo.png"
            alt="Mojeeb"
            className="h-5"
          />

          {/* Skip / Go to dashboard button */}
          {currentStep === OnboardingStep.Success && isSuccessReady ? (
            <button
              onClick={handleOnboardingComplete}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Go to dashboard
            </button>
          ) : (
            <button
              onClick={handleSkipClick}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </header>

      {/* Progress Bar - Below header */}
      {currentStep < OnboardingStep.Success && (
        <OnboardingProgress currentStep={currentStep} totalSteps={4} />
      )}

      {/* Main Content - Mobile-first left-aligned */}
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-12">
        <div className="max-w-3xl mx-auto">
          {renderStep()}
        </div>
      </main>

      {/* Bottom Bar - Back button + Arrow button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 sm:px-6 sm:py-4 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {/* Left: Request demo call button */}
          {demoCallRequested ? (
              <div className="text-xs flex items-center gap-2 text-neutral-500">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Demo call requested
                </span>
                <button
                  type="button"
                  onClick={() => setShowDemoModal(true)}
                  className="text-neutral-500 hover:text-neutral-900 underline transition-colors"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 transition-colors underline"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Request free demo phone call
              </button>
            )}

          {/* Right: Button - Arrow for steps, "Try your agent" for Success */}
          {currentStep === OnboardingStep.Success ? (
            <button
              onClick={handleOnboardingComplete}
              disabled={!isSuccessReady}
              className={`
                px-6 py-3
                rounded-full
                font-medium
                transition-all duration-200
                ${
                  !isSuccessReady
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-neutral-800'
                }
              `}
            >
              Try your agent
            </button>
          ) : (
            <button
              onClick={handleFABClick}
              disabled={!canProceed || isCreatingAgent}
              aria-label="Continue to next step"
              className={`
                w-12 h-12 sm:w-14 sm:h-14
                rounded-full
                flex items-center justify-center
                transition-all duration-200
                ${
                  !canProceed || isCreatingAgent
                    ? 'bg-neutral-300 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-neutral-800'
                }
              `}
            >
              {isCreatingAgent ? (
                <div className="w-5 h-5 border-2 border-neutral-500 border-t-neutral-800 rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Exit Intent Modal */}
      <ExitIntentModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onContinue={handleExitModalContinue}
        onExit={handleExitModalExit}
      />

      {/* Skip Confirmation Modal */}
      <SimpleConfirmModal
        isOpen={showSkipModal}
        onClose={handleSkipCancel}
        title="Skip onboarding?"
        confirmText="Yes, Skip"
        onConfirm={handleSkipConfirm}
      />

      {/* Demo Call Modal */}
      <DemoCallModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onSuccess={(phone) => {
          setDemoCallRequested(true);
          setSubmittedPhone(phone);
        }}
        initialPhone={submittedPhone}
      />
    </div>
  );
};

export default OnboardingWizard;
