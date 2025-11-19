/**
 * Step 2: Choose Purpose
 * Select agent purpose templates (pre-select Customer Support by default)
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore } from '../stores/onboardingStore';
import { AGENT_PURPOSES } from '../constants/agentPurposes';
import type { AgentPurpose } from '../types/onboarding.types';

interface StepPurposeProps {
  onNext: () => void;
  onBack: () => void;
}

export const StepPurpose = ({ onNext, onBack }: StepPurposeProps) => {
  const { data, togglePurpose, setSelectedPurposes } = useOnboardingStore();
  const selectedPurposes = data.selectedPurposes;

  // Pre-select Customer Support on mount (Phase 3 optimization)
  useEffect(() => {
    if (selectedPurposes.length === 0) {
      const customerSupport = AGENT_PURPOSES.find(
        (p) => p.id === 'customer-support'
      );
      if (customerSupport) {
        setSelectedPurposes([customerSupport]);
      }
    }
  }, [selectedPurposes.length, setSelectedPurposes]);

  const handlePurposeClick = (purpose: AgentPurpose) => {
    togglePurpose(purpose);
  };

  const handleSubmit = () => {
    if (selectedPurposes.length > 0) {
      onNext();
    }
  };

  const isSelected = (purposeId: string) => {
    return selectedPurposes.some((p) => p.id === purposeId);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-3">
          What will your agent do?
        </h2>
        <p className="text-neutral-600 text-base">
          Select up to 3 purposes that best describe your agent's role
        </p>
      </div>

      {/* Social Proof - Most Popular Badge */}
      <div className="text-center mb-8">
        <p className="text-sm text-neutral-500">
          Most popular: Customer Support (65%)
        </p>
      </div>

      {/* All 8 Purpose Templates (Phase 3 optimization) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {AGENT_PURPOSES.map((purpose) => {
          const selected = isSelected(purpose.id);
          const isMaxSelected = selectedPurposes.length >= 3 && !selected;

          return (
            <button
              key={purpose.id}
              type="button"
              onClick={() => handlePurposeClick(purpose)}
              disabled={isMaxSelected}
              className={`
                relative p-6 rounded-lg border-2 text-left transition-all
                ${
                  selected
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }
                ${isMaxSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Popular Badge */}
              {purpose.isPopular && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 text-xs font-medium bg-black text-white rounded">
                    Popular
                  </span>
                </div>
              )}

              {/* Selection Checkbox */}
              <div className="flex items-start gap-4">
                <div
                  className={`
                    flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all
                    ${
                      selected
                        ? 'border-black bg-black'
                        : 'border-neutral-300 bg-white'
                    }
                  `}
                >
                  {selected && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{purpose.icon}</span>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {purpose.label}
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-600">
                    {purpose.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection Count */}
      <div className="text-center mb-6">
        <p className="text-sm text-neutral-500">
          {selectedPurposes.length} of 3 selected
          {selectedPurposes.length >= 3 && (
            <span className="ml-2 text-neutral-700 font-medium">
              (Maximum reached)
            </span>
          )}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 text-base"
        >
          ← Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={selectedPurposes.length === 0}
          className="flex-1 h-12 text-base"
        >
          Generate Agent Personality →
        </Button>
      </div>
    </div>
  );
};
