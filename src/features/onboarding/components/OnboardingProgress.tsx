/**
 * Onboarding Progress Component
 * Minimal progress indicator for onboarding wizard
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
    <div className="w-full max-w-2xl mx-auto mb-8">
      {/* Progress bar */}
      <div className="relative h-1 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-black transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
