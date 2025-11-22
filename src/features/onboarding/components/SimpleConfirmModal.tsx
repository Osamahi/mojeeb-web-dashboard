/**
 * Simple Confirmation Modal
 * iOS-style minimal confirmation dialog
 */

import { Modal } from '@/components/ui/Modal';
import { ModalActions } from '@/components/ui/ModalActions';

interface SimpleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  confirmText: string;
  onConfirm: () => void;
}

export const SimpleConfirmModal = ({
  isOpen,
  onClose,
  title,
  confirmText,
  onConfirm,
}: SimpleConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center space-y-6 py-4">
        {/* Title */}
        <h2 className="text-xl font-semibold text-neutral-900">
          {title}
        </h2>

        {/* Buttons - stacked vertically */}
        <ModalActions
          primary={{
            label: 'Back',
            onClick: onClose,
          }}
          secondary={{
            label: confirmText,
            onClick: onConfirm,
            variant: 'secondary',
          }}
          layout="vertical"
        />
      </div>
    </Modal>
  );
};
