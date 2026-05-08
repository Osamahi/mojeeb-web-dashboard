/**
 * Onboarding Prompt Banner
 * Friendly banner suggesting users complete onboarding when they have no agents
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInfiniteAgents } from '@/features/agents/hooks/useInfiniteAgents';
import { useOnboardingStore } from '@/features/onboarding/stores/onboardingStore';

export const OnboardingPromptBanner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // We only need to know "does the user have at least one agent?" — fetch a
  // single row instead of the full list. Reuses the same React Query cache
  // as other consumers, so this is effectively free if another component
  // already hydrated it.
  const { agents, isLoading } = useInfiniteAgents({ limit: 1 });
  const hasAnyAgent = agents.length > 0;
  const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismiss state when agents arrive (e.g. after creation flow).
  useEffect(() => {
    if (hasAnyAgent) {
      setIsDismissed(false);
    }
  }, [hasAnyAgent]);

  // Don't show while loading (avoids a flicker), or if the user has agents,
  // has completed onboarding, or dismissed the banner.
  if (isLoading || hasAnyAgent || hasCompletedOnboarding || isDismissed) {
    return null;
  }

  const handleStartOnboarding = () => {
    navigate('/onboarding');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-700">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left: Message */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-white">
              <span className="font-medium">{t('onboarding_banner.message_title')}</span>
              <span className="hidden sm:inline text-neutral-300 ml-2">
                {t('onboarding_banner.message_subtitle')}
              </span>
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartOnboarding}
              className="px-4 py-1.5 bg-white text-neutral-900 text-sm font-medium rounded-md hover:bg-neutral-100 transition-colors"
            >
              {t('onboarding_banner.create_agent_button')}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-neutral-300 hover:text-white text-sm transition-colors"
              aria-label={t('onboarding_banner.dismiss_label')}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
