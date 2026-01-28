/**
 * Accept Invitation Confirmation Dialog
 *
 * Warns user before switching organizations if they have open conversations
 */

import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface AcceptInvitationConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  organizationName: string;
  isLoading?: boolean;
}

export const AcceptInvitationConfirmDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  organizationName,
  isLoading = false,
}: AcceptInvitationConfirmDialogProps) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Switch Organization?"
      maxWidth="md"
      isLoading={isLoading}
      closable={!isLoading}
    >
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        {/* Warning Message */}
        <div className="text-center space-y-2">
          <p className="text-neutral-700">
            You have an open conversation. Switching to <strong>{organizationName}</strong> will close it and load new
            data.
          </p>
          <p className="text-sm text-neutral-500">This action cannot be undone, but you can switch back later.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button variant="secondary" onClick={onCancel} className="w-full sm:w-1/2" disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-1/2" disabled={isLoading}>
            {isLoading ? 'Switching...' : 'Switch Organization'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
