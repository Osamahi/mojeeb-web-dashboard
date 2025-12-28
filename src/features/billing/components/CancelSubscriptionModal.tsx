import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { useCancelSubscriptionMutation } from '../hooks/useCancelSubscriptionMutation';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPeriodEnd?: string;
}

/**
 * Modal for canceling subscription
 *
 * Provides two cancellation options:
 * 1. Cancel at period end (user retains access until billing period ends)
 * 2. Cancel immediately (access revoked immediately)
 *
 * Uses BaseModal pattern with loading state management.
 */
export function CancelSubscriptionModal({
  isOpen,
  onClose,
  currentPeriodEnd,
}: CancelSubscriptionModalProps) {
  const { t } = useTranslation();
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);

  const mutation = useCancelSubscriptionMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const handleConfirm = () => {
    mutation.mutate({ cancelAtPeriodEnd });
  };

  const periodEndDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('billing.cancel_subscription')}
      subtitle={t('billing.cancel_modal_subtitle')}
      maxWidth="md"
      isLoading={mutation.isPending}
      closable={!mutation.isPending}
    >
      <div className="space-y-6">
        {/* Warning message */}
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">{t('billing.cancel_warning_title')}</p>
            <p>{t('billing.cancel_warning_message')}</p>
          </div>
        </div>

        {/* Cancellation options */}
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
            <input
              type="radio"
              name="cancellation-type"
              checked={cancelAtPeriodEnd}
              onChange={() => setCancelAtPeriodEnd(true)}
              className="mt-0.5"
              disabled={mutation.isPending}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{t('billing.cancel_at_period_end')}</div>
              <div className="text-sm text-gray-600 mt-1">
                {periodEndDate
                  ? t('billing.cancel_at_period_end_desc_with_date', { date: periodEndDate })
                  : t('billing.cancel_at_period_end_desc')}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
            <input
              type="radio"
              name="cancellation-type"
              checked={!cancelAtPeriodEnd}
              onChange={() => setCancelAtPeriodEnd(false)}
              className="mt-0.5"
              disabled={mutation.isPending}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{t('billing.cancel_immediately')}</div>
              <div className="text-sm text-gray-600 mt-1">
                {t('billing.cancel_immediately_desc')}
              </div>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            {t('billing.keep_subscription')}
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending ? t('billing.canceling') : t('billing.cancel_subscription')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
