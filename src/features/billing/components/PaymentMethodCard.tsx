import { useTranslation } from 'react-i18next';
import { CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCreateBillingPortalMutation } from '../hooks/useCreateBillingPortalMutation';
import { getCardBrandInfo, isExpiringWithin } from '../utils/billingHelpers';
import type { PaymentMethodDisplay } from '../types/billing.types';

interface PaymentMethodCardProps {
  paymentMethod?: PaymentMethodDisplay;
  isLoading?: boolean;
}

/**
 * Payment method card component
 *
 * Displays current payment method with:
 * - Card brand and last 4 digits
 * - Expiration date
 * - Expiration warning if within 60 days
 * - "Update" button to open Stripe billing portal
 */
export function PaymentMethodCard({ paymentMethod, isLoading }: PaymentMethodCardProps) {
  const { t } = useTranslation();
  const billingPortalMutation = useCreateBillingPortalMutation({
    autoRedirect: true,
  });

  const handleUpdatePaymentMethod = () => {
    billingPortalMutation.mutate({
      returnUrl: window.location.href,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="h-20 bg-gray-100 animate-pulse rounded" />
      </div>
    );
  }

  if (!paymentMethod) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('billing.payment_method')}</h3>
            <p className="text-sm text-gray-600">{t('billing.no_payment_method')}</p>
          </div>
          <Button onClick={handleUpdatePaymentMethod} disabled={billingPortalMutation.isPending}>
            {billingPortalMutation.isPending ? t('billing.opening') : t('billing.add_payment_method')}
          </Button>
        </div>
      </div>
    );
  }

  const cardInfo = getCardBrandInfo(paymentMethod.brand);
  const isExpiring = isExpiringWithin(paymentMethod.expiryMonth, paymentMethod.expiryYear);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('billing.payment_method')}</h3>
          <p className="text-sm text-gray-600">{t('billing.manage_payment_method')}</p>
        </div>
        <Button
          variant="secondary"
          onClick={handleUpdatePaymentMethod}
          disabled={billingPortalMutation.isPending}
        >
          {billingPortalMutation.isPending ? t('billing.opening') : t('billing.update')}
        </Button>
      </div>

      {/* Card details */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className={`p-2 bg-white rounded ${cardInfo.iconClass}`}>
          <CreditCard className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900">
            {t('billing.card_format', { brand: cardInfo.name, last4: paymentMethod.last4 })}
          </div>
          <div className="text-sm text-gray-600">
            {t('billing.expires', {
              month: paymentMethod.expiryMonth.toString().padStart(2, '0'),
              year: paymentMethod.expiryYear
            })}
          </div>
        </div>
        {isExpiring && (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            {t('billing.expiring_soon')}
          </div>
        )}
      </div>
    </div>
  );
}
