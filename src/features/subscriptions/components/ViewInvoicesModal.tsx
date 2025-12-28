import { BaseModal } from '@/components/ui/BaseModal';
import { InvoiceList } from '@/features/billing/components/InvoiceList';

interface ViewInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for viewing invoice history
 *
 * Displays user's Stripe invoice history with pagination.
 * Wraps the InvoiceList component from billing feature.
 */
export function ViewInvoicesModal({ isOpen, onClose }: ViewInvoicesModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice History"
      subtitle="View and download your past invoices"
      maxWidth="2xl"
    >
      <div className="mt-4">
        <InvoiceList limit={10} />
      </div>
    </BaseModal>
  );
}
