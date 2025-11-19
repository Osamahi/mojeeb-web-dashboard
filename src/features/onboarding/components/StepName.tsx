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
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">
          Name Your Agent
        </h2>
        <p className="text-sm text-neutral-500">
          What's your business or brand name?
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="text"
          placeholder="e.g., Your Business Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
          className="text-base"
        />

        {/* CTA Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base"
          disabled={name.trim().length < 2}
        >
          Continue →
        </Button>
      </form>
    </div>
  );
};
