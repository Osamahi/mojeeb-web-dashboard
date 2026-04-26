/**
 * DeleteSavedMessageModal — confirmation dialog before deleting.
 */

import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { useDeleteSavedMessage } from '../hooks/useSavedMessages';
import type { SavedMessage } from '../types/savedMessages.types';

interface DeleteSavedMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  message: SavedMessage | null;
}

export function DeleteSavedMessageModal({
  isOpen,
  onClose,
  agentId,
  message,
}: DeleteSavedMessageModalProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteSavedMessage(agentId);

  const handleConfirm = async () => {
    if (!message) return;
    try {
      await deleteMutation.mutateAsync(message.id);
      onClose();
    } catch {
      // Toast handled by hook.
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('saved_messages.delete_title')}
      maxWidth="sm"
      isLoading={deleteMutation.isPending}
      closable={!deleteMutation.isPending}
    >
      <div className="space-y-4">
        <p className="text-sm text-neutral-700">
          {t('saved_messages.delete_confirmation', { title: message?.title ?? '' })}
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
