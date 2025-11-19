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
import { agentService } from '@/features/agents/services/agentService';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { currentStep, nextStep, previousStep, setStep, data, completeOnboarding } = useOnboardingStore();
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header with Logo */}
      <header className="bg-white border-b border-neutral-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">Mojeeb</span>
            </div>

            {/* Skip button in header */}
            {currentStep < OnboardingStep.Success && (
              <button
                onClick={() => navigate('/conversations')}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl">
          {/* Progress Bar (hidden on success screen) */}
          {currentStep < OnboardingStep.Success && (
            <OnboardingProgress currentStep={currentStep} totalSteps={4} />
          )}

          {/* Step Content */}
          <div className="mt-8">
            {renderStep()}
          </div>
        </div>
      </main>

      {/* Exit Intent Modal */}
      <ExitIntentModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onContinue={handleExitModalContinue}
        onExit={handleExitModalExit}
      />
    </div>
  );
};

export default OnboardingWizard;
