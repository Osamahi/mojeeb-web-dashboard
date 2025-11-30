/**
 * Disconnect Confirmation Dialog
 * Confirms platform disconnection with user
 */

import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
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
  if (!connection) return null;

  const platform = getPlatformById(connection.platform);
  const accountName = connection.platformAccountName || connection.platformAccountHandle || 'this account';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disconnect Platform"
      size="sm"
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
            Are you sure you want to disconnect <span className="font-semibold">{accountName}</span>?
          </p>
          <p className="text-sm text-neutral-600">
            You will no longer be able to receive or respond to messages from this {platform?.name || 'platform'}.
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
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDisconnecting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
