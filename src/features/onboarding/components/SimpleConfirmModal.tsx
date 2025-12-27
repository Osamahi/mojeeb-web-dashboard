/**
 * Simple Confirmation Modal
 * iOS-style minimal confirmation dialog
 */

import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { ModalActions } from '@/components/ui/ModalActions';
import type { BaseModalProps } from '../types/onboarding.types';

interface SimpleConfirmModalProps extends BaseModalProps {
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
  const { t } = useTranslation();

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="text-center space-y-6">
        {/* Buttons - stacked vertically */}
        <ModalActions
          primary={{
            label: t('simple_confirm.back_button'),
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
    </BaseModal>
  );
};
