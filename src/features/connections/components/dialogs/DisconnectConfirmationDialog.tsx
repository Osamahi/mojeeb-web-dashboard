/**
 * Disconnect Confirmation Dialog
 * Confirms platform disconnection with user
 */

import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import type { PlatformConnection } from '../../types';
import { getPlatformById } from '../../constants/platforms';

export interface DisconnectConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  connection: PlatformConnection | null;
  isDisconnecting?: boolean;
}

export function DisconnectConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  connection,
  isDisconnecting = false,
}: DisconnectConfirmationDialogProps) {
  const { t } = useTranslation();

  if (!connection) return null;

  const platform = getPlatformById(connection.platform);
  const accountName = connection.platformAccountName || connection.platformAccountHandle || t('disconnect_confirmation.account_fallback');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('disconnect_confirmation.title')}
      maxWidth="sm"
      isLoading={isDisconnecting}
      closable={!isDisconnecting}
    >
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <p className="text-sm text-neutral-700">
            {t('disconnect_confirmation.message', { account: accountName })}
          </p>
          <p className="text-sm text-neutral-600">
            {t('disconnect_confirmation.warning', { platform: platform?.name || t('disconnect_confirmation.platform_fallback') })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isDisconnecting}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDisconnecting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDisconnecting ? t('disconnect_confirmation.disconnecting') : t('disconnect_confirmation.disconnect_button')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
