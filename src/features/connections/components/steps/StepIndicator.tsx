/**
 * Step Indicator Component
 * Shows progress through the connection wizard
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export type WizardStep = 'platform' | 'authorize' | 'select' | 'complete';

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'platform', label: 'Platform' },
  { key: 'authorize', label: 'Authorize' },
  { key: 'select', label: 'Select' },
  { key: 'complete', label: 'Done' },
];

type StepIndicatorProps = {
  currentStep: WizardStep;
};

export const StepIndicator = memo(function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = useMemo(() => STEPS.findIndex(s => s.key === currentStep), [currentStep]);

  return (
    <nav className="flex items-center justify-center space-x-1 sm:space-x-2" aria-label="Connection wizard progress">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={step.key}
            className="flex items-center"
            role="listitem"
            aria-current={isCurrent ? 'step' : undefined}
          >
            {/* Step dot/indicator */}
            <div className="flex flex-col items-center">
              <div
                aria-label={`Step ${index + 1}: ${step.label}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  isCompleted && 'bg-neutral-900 text-white',
                  isCurrent && 'bg-neutral-900 text-white ring-2 ring-neutral-300 ring-offset-2',
                  !isCompleted && !isCurrent && 'bg-neutral-200 text-neutral-500'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'mt-1 text-xs hidden sm:block',
                  isCurrent && 'font-medium text-neutral-900',
                  !isCurrent && 'text-neutral-500'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-4 sm:w-8',
                  index < currentIndex ? 'bg-neutral-900' : 'bg-neutral-200'
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
});
