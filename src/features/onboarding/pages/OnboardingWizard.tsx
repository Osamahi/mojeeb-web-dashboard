/**
 * Onboarding Wizard - Main Page
 * 4-step wizard to guide new users through creating their first agent
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../stores/onboardingStore';
import { OnboardingStep } from '../types/onboarding.types';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { StepName } from '../components/StepName';
import { StepPurpose } from '../components/StepPurpose';
import { StepKnowledge } from '../components/StepKnowledge';
import { StepSuccess } from '../components/StepSuccess';
import { ExitIntentModal } from '../components/ExitIntentModal';
import { SimpleConfirmModal } from '../components/SimpleConfirmModal';
import { agentService } from '@/features/agents/services/agentService';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { currentStep, nextStep, previousStep, setStep, data, completeOnboarding } = useOnboardingStore();
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);

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

  // Create agent when reaching success step
  useEffect(() => {
    if (currentStep === OnboardingStep.Success && !isCreatingAgent && !data.createdAgentId) {
      handleCreateAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleCreateAgent = async () => {
    setIsCreatingAgent(true);

    try {
      // Generate persona prompt from selected purposes
      const personaPrompt = data.selectedPurposes
        .map((purpose) => purpose.prompt)
        .join('\n\n');

      // Create the agent
      const agent = await agentService.createAgent({
        name: data.agentName,
        personaPrompt,
      });

      // Create knowledge base if content was provided
      if (data.knowledgeContent && data.knowledgeContent.trim()) {
        const kb = await agentService.createKnowledgeBase({
          name: `${data.agentName} Knowledge Base`,
          content: data.knowledgeContent,
        });

        // Link knowledge base to agent
        await agentService.linkKnowledgeBase(agent.id, kb.id);
      }

      toast.success('Agent created successfully!');
    } catch (error) {
      logger.error('Failed to create agent:', error);
      toast.error('Failed to create agent. Please try again.');
      // Go back to purpose step on error
      setStep(OnboardingStep.Purpose);
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handleStepComplete = () => {
    nextStep();
  };

  const handleSkipKnowledge = () => {
    nextStep();
  };

  const handleOnboardingComplete = () => {
    completeOnboarding();
    // Redirect to dashboard
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
        return <StepSuccess onComplete={handleOnboardingComplete} />;

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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-lg sm:text-xl font-semibold text-neutral-900">Mojeeb</span>
          </div>

          {/* Skip button - with confirmation modal */}
          {currentStep < OnboardingStep.Success && (
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

      {/* Floating Action Button - Bottom right */}
      {currentStep < OnboardingStep.Success && (
        <button
          onClick={handleFABClick}
          disabled={!canProceed}
          aria-label="Continue to next step"
          className={`
            fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-10
            w-14 h-14 sm:w-16 sm:h-16
            rounded-full
            flex items-center justify-center
            shadow-lg hover:shadow-xl
            transition-all duration-200
            ${
              !canProceed
                ? 'bg-neutral-300 cursor-not-allowed'
                : 'bg-black text-white hover:scale-105 active:scale-95'
            }
          `}
        >
          <svg
            className="w-6 h-6"
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
        </button>
      )}

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
        confirmText="Skip"
        onConfirm={handleSkipConfirm}
      />
    </div>
  );
};

export default OnboardingWizard;
