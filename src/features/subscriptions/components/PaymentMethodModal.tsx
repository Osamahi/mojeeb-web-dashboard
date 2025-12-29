import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { PaymentMethodCard } from '@/features/billing/components/PaymentMethodCard';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for viewing and managing payment method
 *
 * Displays current payment method with option to update via Stripe billing portal.
 * Wraps the PaymentMethodCard component from billing feature.
 */
export function PaymentMethodModal({ isOpen, onClose }: PaymentMethodModalProps) {
  const { t } = useTranslation();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('subscriptions.payment_method')}
      subtitle={t('subscriptions.payment_method_subtitle')}
      maxWidth="md"
    >
      <div className="mt-4">
        <PaymentMethodCard />
      </div>
    </BaseModal>
  );
}
