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
  return (
    <div
      className="w-full max-w-2xl mx-auto mb-8"
      role="navigation"
      aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
    >
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActiveOrCompleted = index <= currentStep;

          return (
            <div
              key={index}
              className="w-2 h-2 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: isActiveOrCompleted
                  ? 'rgb(10, 10, 10)' // MinimalColors.black
                  : 'rgb(163, 163, 163)', // MinimalColors.grey300
              }}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
};
