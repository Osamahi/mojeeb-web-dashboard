/**
 * Onboarding Wizard - Main Page
 * 4-step wizard to guide new users through creating their first agent
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
import { AuthHeader } from '@/components/layout/AuthHeader';
import { queryKeys } from '@/lib/queryKeys';
import { VALIDATION_RULES } from '../constants/validationRules';
import { PhoneIcon, ArrowRightIcon, CheckCircleIcon } from '@/shared/components/icons';
import { PrimaryButton } from '../components/shared/PrimaryButton';

export const OnboardingWizard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentStep, nextStep, data, completeOnboarding, resetOnboardingState } = useOnboardingStore();
  const [isSuccessReady, setIsSuccessReady] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoCallRequested, setDemoCallRequested] = useState(false);

  // Handle browser back button and exit intent
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (currentStep > OnboardingStep.Name && currentStep < OnboardingStep.Success) {
        // Push state back to prevent navigation
        window.history.pushState(null, '', window.location.pathname);
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

    // Push initial state to enable popstate detection
    window.history.pushState(null, '', window.location.pathname);

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentStep]); // Removed previousStep - not used in effect

  const handleStepComplete = () => {
    // All steps just advance to next - agent creation happens in Success step
    nextStep();
  };

  const handleOnboardingComplete = () => {
    completeOnboarding(); // Only marks as completed, doesn't reset step/data

    // CRITICAL: Invalidate React Query cache to force refetch on next mount
    // This ensures DashboardLayout gets fresh agents list including newly created agent
    queryClient.invalidateQueries({ queryKey: queryKeys.agents() });

    // Navigate to Studio page where user can test their new agent
    navigate('/studio');

    // Reset store state after navigation completes
    // This prevents flicker back to Step 1 during navigation
    setTimeout(() => {
      resetOnboardingState();
    }, 500);
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
    navigate('/studio');
  };

  const handleSkipCancel = () => {
    setShowSkipModal(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case OnboardingStep.Name:
        return <StepName onNext={handleStepComplete} />;

      case OnboardingStep.Purpose:
        return <StepPurpose />;

      case OnboardingStep.Knowledge:
        return (
          <StepKnowledge
            onNext={handleStepComplete}
          />
        );

      case OnboardingStep.Success:
        return (
          <StepSuccess
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
        return data.agentName.trim().length >= VALIDATION_RULES.AGENT_NAME_MIN_LENGTH;
      case OnboardingStep.Purpose:
        return data.selectedPurposes.length > 0;
      case OnboardingStep.Knowledge:
        return true; // Knowledge is optional
      default:
        return false;
    }
  })();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header - AuthHeader with skip/dashboard button */}
      <AuthHeader
        showLanguageSwitcher={false}
        actionButton={
          currentStep === OnboardingStep.Success && isSuccessReady ? (
            <button
              onClick={handleOnboardingComplete}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              {t('onboarding.go_to_dashboard')}
            </button>
          ) : (
            <button
              onClick={handleSkipClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              {t('onboarding.skip')}
            </button>
          )
        }
      />

      {/* Progress Bar - Below header */}
      {currentStep < OnboardingStep.Success && (
        <OnboardingProgress currentStep={currentStep} totalSteps={4} />
      )}

      {/* Main Content - Mobile-first left-aligned */}
      <main className="flex-1 px-4 pt-20 pb-6 sm:px-6 sm:pt-24 sm:pb-12">
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
                  <CheckCircleIcon className="w-3 h-3" />
                  {t('onboarding.demo_requested')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowDemoModal(true)}
                  className="text-neutral-500 hover:text-neutral-900 underline transition-colors"
                >
                  {t('common.edit')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 transition-colors underline"
              >
                <PhoneIcon />
                {t('onboarding.request_demo')}
              </button>
            )}

          {/* Right: Button - Arrow for steps, "Try your agent" for Success */}
          {currentStep === OnboardingStep.Success ? (
            <PrimaryButton
              onClick={handleOnboardingComplete}
              disabled={!isSuccessReady}
              variant="rounded"
            >
              {t('onboarding.try_your_agent')}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onClick={handleStepComplete}
              disabled={!canProceed}
              variant="fab"
              aria-label={t('onboarding.continue_to_next')}
            >
              <ArrowRightIcon />
            </PrimaryButton>
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
        title={t('onboarding.skip_title')}
        confirmText={t('onboarding.skip_confirm')}
        onConfirm={handleSkipConfirm}
      />

      {/* Demo Call Modal */}
      <DemoCallModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onSuccess={() => {
          setDemoCallRequested(true);
        }}
      />
    </div>
  );
};

export default OnboardingWizard;
