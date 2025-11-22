/**
 * Step 1: Name Your Agent
 * First step of onboarding where user names their agent
 */

import { useState, useEffect } from 'react';
import { useOnboardingStore } from '../stores/onboardingStore';
import { VALIDATION_RULES } from '../constants/validationRules';
import { CheckCircleIcon } from '@/shared/components/icons';
import { StepHeading, StepSubtitle } from './shared/StepHeading';

interface StepNameProps {
  onNext: () => void;
}

/**
 * Validate agent name against minimum length requirement
 * @param name - The agent name to validate
 * @returns Object with validation result and error message
 */
const validateAgentName = (name: string): { isValid: boolean; error: string } => {
  const trimmed = name.trim();
  if (trimmed.length < VALIDATION_RULES.AGENT_NAME_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Agent name must be at least ${VALIDATION_RULES.AGENT_NAME_MIN_LENGTH} characters`,
    };
  }
  return { isValid: true, error: '' };
};

export const StepName = ({ onNext }: StepNameProps) => {
  const { data, setAgentName } = useOnboardingStore();
  const [name, setName] = useState(data.agentName);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Update store when name changes
  useEffect(() => {
    const validation = validateAgentName(name);
    setIsValid(validation.isValid);
    if (validation.isValid) {
      setAgentName(name);
      setError('');
    }
  }, [name, setAgentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation already handled by useEffect (line 40)
    // Store already updated by useEffect (line 43)
    // Only proceed if valid
    if (!isValid) return;

    onNext();
  };

  return (
    <div className="w-full">
      <StepHeading>Name Your Agent</StepHeading>
      <StepSubtitle>What's your business or brand name?</StepSubtitle>

      {/* Form - FAB handles submission */}
      <form onSubmit={handleSubmit}>
        <div className="relative mb-20">
          <input
            id="agentName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Your Business Name"
            autoFocus
            className="w-full px-4 py-3 text-base border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
          />
          {isValid && !error && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <CheckCircleIcon />
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </form>
    </div>
  );
};
