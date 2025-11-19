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
    <div className="w-full">
      {/* Mobile-first heading - left-aligned */}
      <h1 className="text-3xl sm:text-4xl font-bold text-neutral-950 mb-2 tracking-tight">
        What will your agent do?
      </h1>
      <p className="text-sm sm:text-base text-neutral-600 mb-6">
        Choose up to 3 purposes for your agent
      </p>

      {/* Selection counter */}
      <div className="mb-4 text-sm text-neutral-600">
        {selectedPurposes.length} of 3 selected
        {selectedPurposes.length >= 3 && (
          <span className="ml-2 text-neutral-700 font-medium">
            (Maximum reached)
          </span>
        )}
      </div>

      {/* Vertical card list with radio buttons */}
      <div className="space-y-3 mb-8">
        {AGENT_PURPOSES.map((purpose) => {
          const selected = isSelected(purpose.id);
          const disabled = !selected && selectedPurposes.length >= 3;

          return (
            <button
              key={purpose.id}
              type="button"
              onClick={() => !disabled && handlePurposeClick(purpose)}
              disabled={disabled}
              className={`
                w-full px-4 py-4 rounded-xl border-2 text-left transition-all
                flex items-start gap-3
                ${
                  selected
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Radio button */}
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${selected ? 'border-black' : 'border-neutral-400'}
                  `}
                >
                  {selected && <div className="w-3 h-3 rounded-full bg-black" />}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{purpose.icon}</span>
                  <span className="text-base font-semibold text-neutral-900">
                    {purpose.label}
                  </span>
                  {purpose.isPopular && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-neutral-900 text-white rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-600 line-clamp-2">
                  {purpose.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Back button - text link bottom left (mobile-friendly) */}
      <button
        onClick={onBack}
        className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </button>
    </div>
  );
};
