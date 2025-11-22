/**
 * Exit Intent Modal
 * Displays when user tries to leave onboarding to prevent abandonment
 */

import { Modal } from '@/components/ui/Modal';
import { ModalActions } from '@/components/ui/ModalActions';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onExit: () => void;
}

export const ExitIntentModal = ({
  isOpen,
  onClose,
  onContinue,
  onExit,
}: ExitIntentModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Are you sure you want to leave?">
      <div className="space-y-4">
        {/* Warning Message */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-amber-900 mb-1">
              Your progress will be lost
            </h4>
            <p className="text-sm text-amber-800">
              If you leave now, you'll need to start over. It only takes 2 more
              minutes to complete your agent setup.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-900">
            Why complete your setup:
          </p>
          <ul className="space-y-1 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Get your AI agent running in minutes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Start automating customer support instantly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Save hours of manual work every week</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-4">
          <ModalActions
            primary={{
              label: 'Continue Setup',
              onClick: onContinue,
            }}
            secondary={{
              label: 'Leave Anyway',
              onClick: onExit,
              variant: 'outline',
            }}
            layout="horizontal"
            useButtonComponent={true}
          />
        </div>
      </div>
    </Modal>
  );
};
