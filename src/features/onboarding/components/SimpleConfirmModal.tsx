/**
 * Simple Confirmation Modal
 * iOS-style minimal confirmation dialog
 */

import { Modal } from '@/components/ui/Modal';

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
        <div className="space-y-3">
          {/* Back button - primary/focused (black) */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3.5 bg-black text-white text-base font-medium rounded-xl hover:bg-neutral-800 transition-colors"
          >
            Back
          </button>

          {/* Skip button - secondary (text only) */}
          <button
            onClick={onConfirm}
            className="w-full px-4 py-3.5 text-base font-medium text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
