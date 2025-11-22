/**
 * Exit Intent Modal
 * Displays when user tries to leave onboarding to prevent abandonment
 */

import { Modal } from '@/components/ui/Modal';
import { ModalActions } from '@/components/ui/ModalActions';
import { WarningIcon } from '@/shared/components/icons';

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
            <WarningIcon className="w-5 h-5 text-amber-600" />
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
