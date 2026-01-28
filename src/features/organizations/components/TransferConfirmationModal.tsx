/**
 * Transfer Confirmation Modal
 * Shows warning when accepting invitation would transfer user between organizations
 */

import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface TransferConfirmationModalProps {
  isOpen: boolean;
  currentOrgName: string;
  newOrgName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TransferConfirmationModal = ({
  isOpen,
  currentOrgName,
  newOrgName,
  onConfirm,
  onCancel,
  isLoading = false
}: TransferConfirmationModalProps) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Transfer Organization"
      maxWidth="md"
      isLoading={isLoading}
      closable={!isLoading}
    >
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        {/* Current Organization Info */}
        <div className="text-center space-y-2">
          <p className="text-neutral-700 font-medium">
            You are currently a member of:
          </p>
          <p className="text-xl font-semibold text-neutral-900">
            {currentOrgName}
          </p>
        </div>

        {/* Warning Message */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900 leading-relaxed">
            Accepting this invitation will <strong>remove you</strong> from{' '}
            <strong>"{currentOrgName}"</strong> and transfer your account to{' '}
            <strong>"{newOrgName}"</strong>.
          </p>
        </div>

        {/* Impact Warning */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-700 leading-relaxed">
            <strong>This action will:</strong>
          </p>
          <ul className="mt-2 space-y-1 text-sm text-neutral-600 list-disc list-inside">
            <li>Remove your access to all agents and data in {currentOrgName}</li>
            <li>Grant you access to {newOrgName}'s workspace</li>
            <li>Cannot be undone without a new invitation</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Accept & Transfer
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
