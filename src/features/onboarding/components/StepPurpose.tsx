/**
 * Step 2: Choose Purpose
 * Select agent purpose templates (pre-select Customer Support by default)
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../stores/onboardingStore';
import { AGENT_PURPOSES } from '../constants/agentPurposes';
import type { AgentPurpose } from '../types/onboarding.types';
import { CheckmarkIcon } from '@/shared/components/icons';
import { StepHeading, StepSubtitle } from './shared/StepHeading';

export const StepPurpose = () => {
  const { t } = useTranslation();
  const { data, togglePurpose, setSelectedPurposes } = useOnboardingStore();
  const selectedPurposes = data.selectedPurposes;
  const hasPreselected = useRef(false);

  // Pre-select Customer Support on mount (Phase 3 optimization)
  // Use ref to ensure this only runs once, preventing unnecessary re-renders
  useEffect(() => {
    if (!hasPreselected.current && selectedPurposes.length === 0) {
      const customerSupport = AGENT_PURPOSES.find(
        (p) => p.id === 'customer-support'
      );
      if (customerSupport) {
        setSelectedPurposes([customerSupport]);
        hasPreselected.current = true;
      }
    }
  }, [selectedPurposes.length, setSelectedPurposes]);

  const handlePurposeClick = (purpose: AgentPurpose) => {
    togglePurpose(purpose);
  };

  const isSelected = (purposeId: string) => {
    return selectedPurposes.some((p) => p.id === purposeId);
  };

  return (
    <div className="w-full">
      <StepHeading>{t('onboarding.step_purpose_title')}</StepHeading>
      <StepSubtitle>{t('onboarding.step_purpose_subtitle')}</StepSubtitle>

      {/* Vertical card list with checkboxes */}
      <div className="space-y-3 mb-20">
        {AGENT_PURPOSES.map((purpose) => {
          const selected = isSelected(purpose.id);

          return (
            <button
              key={purpose.id}
              type="button"
              onClick={() => handlePurposeClick(purpose)}
              className={`
                w-full px-4 py-4 rounded-xl border-2 text-left transition-all
                flex items-start gap-3 cursor-pointer
                ${
                  selected
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }
              `}
            >
              {/* Checkbox */}
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center
                    ${selected ? 'border-black bg-black' : 'border-neutral-400 bg-white'}
                  `}
                >
                  {selected && <CheckmarkIcon className="w-3 h-3 text-white" />}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{purpose.icon}</span>
                  <span className="text-base font-semibold text-neutral-900">
                    {t(`onboarding.purpose_${purpose.id.replace(/-/g, '_')}`)}
                  </span>
                  {purpose.isPopular && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-neutral-900 text-white rounded-full">
                      {t('onboarding.purpose_popular_badge')}
                    </span>
                  )}
                </div>

                {/* Animated description - only show when selected */}
                <div
                  className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${selected ? 'max-h-20 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}
                  `}
                >
                  <p className="text-sm text-neutral-600 text-start">
                    {t(`onboarding.purpose_${purpose.id.replace(/-/g, '_')}_desc`)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
