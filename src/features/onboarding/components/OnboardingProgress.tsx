/**
 * Onboarding Progress Component
 * Airbnb-style progress bar for onboarding wizard
 */

import { OnboardingStep } from '../types/onboarding.types';

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
  totalSteps?: number;
}

const STEP_LABELS = ['Name', 'Purpose', 'Knowledge', 'Success'];

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

      {/* Step indicators */}
      <div className="flex justify-between mt-4">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2"
            >
              {/* Step dot */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-black text-white'
                      : isCurrent
                      ? 'bg-black text-white ring-4 ring-neutral-200'
                      : 'bg-neutral-200 text-neutral-500'
                  }
                `}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Step label */}
              <span
                className={`
                  text-xs font-medium transition-colors
                  ${
                    isCompleted || isCurrent
                      ? 'text-neutral-900'
                      : 'text-neutral-500'
                  }
                `}
              >
                {STEP_LABELS[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
