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
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Method"
      subtitle="Manage your payment information"
      maxWidth="md"
    >
      <div className="mt-4">
        <PaymentMethodCard />
      </div>
    </BaseModal>
  );
}
