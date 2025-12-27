/**
 * Exit Intent Modal
 * Displays when user tries to leave onboarding to prevent abandonment
 */

import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { ModalActions } from '@/components/ui/ModalActions';
import { WarningIcon } from '@/shared/components/icons';
import type { BaseModalProps } from '../types/onboarding.types';

interface ExitIntentModalProps extends BaseModalProps {
  onContinue: () => void;
  onExit: () => void;
}

export const ExitIntentModal = ({
  isOpen,
  onClose,
  onContinue,
  onExit,
}: ExitIntentModalProps) => {
  const { t } = useTranslation();

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('exit_intent_modal.title')} maxWidth="md">
      <div className="space-y-4">
        {/* Warning Message */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex-shrink-0 mt-0.5">
            <WarningIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-amber-900 mb-1">
              {t('exit_intent_modal.warning_title')}
            </h4>
            <p className="text-sm text-amber-800">
              {t('exit_intent_modal.warning_message')}
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-900">
            {t('exit_intent_modal.benefits_title')}
          </p>
          <ul className="space-y-1 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>{t('exit_intent_modal.benefit_1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>{t('exit_intent_modal.benefit_2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>{t('exit_intent_modal.benefit_3')}</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-4">
          <ModalActions
            primary={{
              label: t('exit_intent_modal.continue_button'),
              onClick: onContinue,
            }}
            secondary={{
              label: t('exit_intent_modal.leave_button'),
              onClick: onExit,
              variant: 'outline',
            }}
            layout="horizontal"
            useButtonComponent={true}
          />
        </div>
      </div>
    </BaseModal>
  );
};
