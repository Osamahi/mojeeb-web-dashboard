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

  // Update store when name changes
  useEffect(() => {
    if (name.length >= 2) {
      setAgentName(name);
      setError('');
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
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-3">
          Name Your Agent
        </h2>
        <p className="text-neutral-600 text-base">
          Give your AI agent a friendly name that represents its purpose
        </p>
      </div>

      {/* Social Proof */}
      <div className="text-center mb-8">
        <p className="text-sm text-neutral-500">
          Join 10,000+ businesses using Mojeeb
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="text"
          placeholder="e.g., Support Assistant, Sales Bot, FAQ Helper"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
          className="text-base"
        />

        {/* Helper text */}
        <p className="text-sm text-neutral-500 -mt-2">
          Don't worry, you can change this later in settings
        </p>

        {/* CTA Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base"
          disabled={name.trim().length < 2}
        >
          Create My Agent →
        </Button>
      </form>

      {/* Examples */}
      <div className="mt-8 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-xs font-medium text-neutral-700 mb-2">
          Popular names:
        </p>
        <div className="flex flex-wrap gap-2">
          {['Support Assistant', 'Sales Bot', 'FAQ Helper', 'Booking Agent'].map(
            (example) => (
              <button
                key={example}
                type="button"
                onClick={() => setName(example)}
                className="px-3 py-1 text-xs bg-white border border-neutral-300 rounded-md hover:bg-neutral-100 transition-colors"
              >
                {example}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
