import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { BaseModal } from '@/components/ui/BaseModal';
import { useRevokeApiKey } from '../hooks/useApiKeys';
import { formatApiKeyDisplay, type ApiKey } from '../types/apiKey.types';
import { isToastHandled } from '@/lib/errors';

interface RevokeApiKeyDialogProps {
  apiKey: ApiKey | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RevokeApiKeyDialog({ apiKey, isOpen, onClose }: RevokeApiKeyDialogProps) {
  const { t } = useTranslation();
  const revokeMutation = useRevokeApiKey();
  const [reason, setReason] = useState('');

  const handleClose = () => {
    if (revokeMutation.isPending) return;
    setReason('');
    onClose();
  };

  const handleRevoke = async () => {
    if (!apiKey) return;
    try {
      await revokeMutation.mutateAsync({
        id: apiKey.id,
        request: reason.trim() ? { reason: reason.trim() } : undefined,
      });
      toast.success(t('api_keys.revoke_dialog.revoked_toast', 'API key revoked'));
      setReason('');
      onClose();
    } catch (error) {
      if (!isToastHandled(error)) {
        toast.error(t('api_keys.revoke_dialog.revoke_failed', 'Failed to revoke API key'));
      }
    }
  };

  if (!apiKey) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('api_keys.revoke_dialog.title', 'Revoke API key')}
      subtitle={t(
        'api_keys.revoke_dialog.subtitle',
        'This action takes effect immediately and cannot be undone.'
      )}
      maxWidth="sm"
      isLoading={revokeMutation.isPending}
      closable={!revokeMutation.isPending}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-rose-900">
            <div className="font-medium">{apiKey.name}</div>
            <div className="font-mono text-xs text-rose-700 mt-0.5">
              {formatApiKeyDisplay(apiKey)}
            </div>
            <div className="mt-2">
              {t(
                'api_keys.revoke_dialog.warning',
                'Any integration using this key will stop working immediately.'
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('api_keys.revoke_dialog.reason_label', 'Reason (optional)')}
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('api_keys.revoke_dialog.reason_placeholder', 'e.g. Leaked, no longer used') ?? ''}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent"
            maxLength={200}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            disabled={revokeMutation.isPending}
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleRevoke}
            disabled={revokeMutation.isPending}
            className="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {revokeMutation.isPending
              ? t('common.revoking', 'Revoking…')
              : t('api_keys.revoke_dialog.revoke_cta', 'Revoke key')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

export default RevokeApiKeyDialog;
