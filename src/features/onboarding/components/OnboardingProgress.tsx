/**
 * Onboarding Progress Component
 * Thin horizontal progress bar for mobile-first onboarding
 */

import { OnboardingStep } from '../types/onboarding.types';

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
  totalSteps?: number;
}

export const OnboardingProgress = ({
  currentStep,
  totalSteps = 4,
}: OnboardingProgressProps) => {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Thin progress bar - full width at top */}
      <div className="h-1 bg-neutral-200">
        <div
          className="h-full bg-black transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
        />
      </div>
    </div>
  );
};
