/**
 * Step 4: Success Screen
 * Celebration screen with confetti before signup
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore } from '../stores/onboardingStore';
import Confetti from 'react-confetti';

interface StepSuccessProps {
  onComplete: () => void;
}

export const StepSuccess = ({ onComplete }: StepSuccessProps) => {
  const { data } = useOnboardingStore();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-advance after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      {/* Confetti */}
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.3}
      />

      {/* Success Content */}
      <div className="w-full max-w-md mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-neutral-900 mb-3">
          Your AI Agent is Ready!
        </h2>

        <p className="text-lg text-neutral-600 mb-2">
          <span className="font-semibold">{data.agentName}</span> is configured and
          ready to assist
        </p>

        <p className="text-sm text-neutral-500 mb-8">
          {data.selectedPurposes.length > 0 && (
            <>
              Specialized in:{' '}
              <span className="font-medium">
                {data.selectedPurposes.map((p) => p.label).join(', ')}
              </span>
            </>
          )}
        </p>

        {/* Auto-redirect message */}
        <p className="text-sm text-neutral-500 mb-6">
          Redirecting you to your dashboard...
        </p>

        {/* Manual Continue Button */}
        <Button
          onClick={onComplete}
          className="w-full h-12 text-base"
        >
          Go to Dashboard →
        </Button>

        {/* Next Steps Preview */}
        <div className="mt-12 p-6 bg-neutral-50 rounded-lg border border-neutral-200 text-left">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">
            What's Next?
          </h3>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Start chatting with your agent</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Add more knowledge and customize settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Invite team members to collaborate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Deploy your agent to your website</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};
