import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Subscription cancel page
 *
 * Displayed when user cancels Stripe checkout.
 * Provides options to return to my subscription or try again.
 */
export default function SubscriptionCancelPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
        {/* Cancel icon */}
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-10 h-10 text-gray-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('billing.checkout_canceled')}</h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">{t('billing.checkout_canceled_message')}</p>

        {/* Additional info */}
        <div className="text-sm text-gray-600 mb-6 p-4 bg-gray-50 rounded">
          <p className="mb-2">{t('billing.checkout_issues_support')}</p>
          <p>{t('billing.checkout_try_again')}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate('/my-subscription')}>{t('billing.return_to_subscription')}</Button>
          <Button variant="secondary" onClick={() => navigate('/')}>
            {t('billing.go_to_dashboard')}
          </Button>
        </div>
      </div>
    </div>
  );
}
