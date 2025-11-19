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
    <div className="w-full max-w-2xl mx-auto mb-4">
      {/* Step dots */}
      <div className="flex justify-center gap-2 mb-3">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;

          return (
            <div
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${
                  isCompleted || isCurrent
                    ? 'bg-black'
                    : 'bg-neutral-300'
                }
              `}
            />
          );
        })}
      </div>

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
