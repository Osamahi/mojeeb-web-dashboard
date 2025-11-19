/**
 * Step 1: Name Your Agent
 * First step of onboarding where user names their agent
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore } from '../stores/onboardingStore';

interface StepNameProps {
  onNext: () => void;
}

export const StepName = ({ onNext }: StepNameProps) => {
  const { data, setAgentName } = useOnboardingStore();
  const [name, setName] = useState(data.agentName);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Update store when name changes
  useEffect(() => {
    const trimmedName = name.trim();
    if (trimmedName.length >= 2) {
      setAgentName(name);
      setError('');
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [name, setAgentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (name.trim().length < 2) {
      setError('Agent name must be at least 2 characters');
      return;
    }

    setAgentName(name);
    onNext();
  };

  return (
    <div className="w-full">
      {/* Mobile-first heading - left-aligned */}
      <h1 className="text-3xl sm:text-4xl font-bold text-neutral-950 mb-2 tracking-tight">
        Name Your Agent
      </h1>
      <p className="text-sm sm:text-base text-neutral-600 mb-8">
        What's your business or brand name?
      </p>

      {/* Form - FAB handles submission */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
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
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </form>
    </div>
  );
};
