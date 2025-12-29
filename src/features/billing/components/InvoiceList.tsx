import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useInvoicesQuery } from '../hooks/useInvoicesQuery';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusColor,
  getInvoiceStatusLabel,
} from '../utils/billingHelpers';

interface InvoiceListProps {
  limit?: number;
}

/**
 * Invoice list component
 *
 * Displays invoice history with:
 * - Invoice number, date, amount, status
 * - Download PDF and view hosted invoice actions
 * - Cursor-based pagination (load more)
 * - Empty state for no invoices
 * - Loading state
 * - Only fetches invoices if payment method is "stripe"
 */
export function InvoiceList({ limit = 10 }: InvoiceListProps) {
  const { t } = useTranslation();
  const [startingAfter, setStartingAfter] = useState<string | undefined>(undefined);

  // Get current subscription to check payment method
  const subscription = useSubscriptionStore((state) => state.subscription);
  const isStripeSubscription = subscription?.paymentMethod?.toLowerCase() === 'stripe';

  const { data, isLoading, error } = useInvoicesQuery(
    { limit, startingAfter },
    { enabled: isStripeSubscription } // Only fetch if using Stripe
  );

  // Show message if not using Stripe payment method
  if (!isStripeSubscription) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-gray-400 mb-2">
          <Download className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600 font-medium">{t('billing.no_invoices_yet')}</p>
        <p className="text-sm text-gray-500 mt-1">
          {t('billing.stripe_invoices_only', 'Invoice history is only available for Stripe subscriptions')}
        </p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{t('billing.invoices_failed_load')}</p>
        <p className="text-sm text-gray-600 mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data || data.invoices.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-gray-400 mb-2">
          <Download className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600 font-medium">{t('billing.no_invoices_yet')}</p>
        <p className="text-sm text-gray-500 mt-1">{t('billing.invoice_history_desc')}</p>
      </div>
    );
  }

  const handleLoadMore = () => {
    const lastInvoice = data.invoices[data.invoices.length - 1];
    if (lastInvoice) {
      setStartingAfter(lastInvoice.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Invoice list */}
      <div className="space-y-2">
        {data.invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            {/* Left side: Invoice info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-medium text-gray-900">
                  {invoice.number || invoice.id}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}
                >
                  {getInvoiceStatusLabel(invoice.status)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {formatDate(invoice.created)} • {formatCurrency(invoice.amountDue, invoice.currency)}
              </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-2">
              {invoice.invoicePdf && (
                <a
                  href={invoice.invoicePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-5 h-5" />
                </a>
              )}
              {invoice.hostedInvoiceUrl && (
                <a
                  href={invoice.hostedInvoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="View invoice"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load more button */}
      {data.hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? t('billing.loading') : t('billing.load_more')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Total count */}
      {data.totalCount > 0 && (
        <p className="text-sm text-gray-600 text-center pt-2">
          {t('billing.showing_invoices', { count: data.invoices.length, total: data.totalCount })}
        </p>
      )}
    </div>
  );
}
