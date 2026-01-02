import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useVerifyCheckoutSession } from '../hooks/useVerifyCheckoutSession';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAnalytics } from '@/lib/analytics';

/**
 * Subscription success page
 *
 * Displayed after successful Stripe checkout redirect.
 * Parses session_id from URL and waits for webhook to process.
 *
 * Flow:
 * 1. User completes checkout on Stripe
 * 2. Stripe redirects to this page with ?session_id=...
 * 3. Webhook processes checkout.session.completed event
 * 4. We poll/wait for subscription to be created
 * 5. Show success message and redirect to my subscription
 */
export default function SubscriptionSuccessPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_subscription_success');
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const sessionId = searchParams.get('session_id');
  const hasTrackedPurchase = useRef(false);

  // Verify checkout session (optional - for better UX)
  const { data: sessionData, isLoading: isVerifying } = useVerifyCheckoutSession(sessionId);

  // Get current subscription from store
  const subscription = useSubscriptionStore((state) => state.subscription);
  const refreshSubscription = useSubscriptionStore((state) => state.refreshSubscription);
  const isLoadingSubscription = useSubscriptionStore((state) => state.isLoading);

  useEffect(() => {
    // Refresh subscription immediately
    // (webhook might have already processed)
    refreshSubscription();

    // Start countdown to redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/my-subscription');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, refreshSubscription]);

  // Track subscription purchase when subscription becomes active
  useEffect(() => {
    if (subscription && subscription.status === 'active' && !hasTrackedPurchase.current) {
      hasTrackedPurchase.current = true;

      // Track purchase - sends to all analytics providers
      track('subscription_purchased', {
        subscriptionId: subscription.id,
        planName: subscription.planName,
        planCode: subscription.planCode,
        amount: subscription.amount,
        currency: subscription.currency,
        billingInterval: subscription.billingInterval,
        paymentMethod: 'stripe',
        userId: subscription.customerId, // Customer ID as user context
      });
    }
  }, [subscription, track]);

  // Determine if subscription was successfully created
  const isSubscriptionCreated = subscription && subscription.status === 'active';
  const isProcessing = isVerifying || isLoadingSubscription;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
        {/* Success icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('billing.payment_successful')}</h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">{t('billing.payment_successful_message')}</p>

        {/* Session ID (for debugging) */}
        {sessionId && (
          <div className="text-xs text-gray-500 mb-6 p-3 bg-gray-50 rounded font-mono break-all">
            {t('billing.session_id', { id: sessionId })}
          </div>
        )}

        {/* Subscription status */}
        {isSubscriptionCreated ? (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-6 p-3 bg-green-50 rounded">
            <CheckCircle className="w-4 h-4" />
            <span>{t('billing.subscription_activated')}</span>
          </div>
        ) : isProcessing ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('billing.finalizing_subscription')}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-amber-600 mb-6 p-3 bg-amber-50 rounded">
            <AlertCircle className="w-4 h-4" />
            <span>{t('billing.subscription_processing')}</span>
          </div>
        )}

        {/* Redirect countdown */}
        <p className="text-sm text-gray-600 mb-6">
          {t('billing.redirecting_countdown', { seconds: countdown })}
        </p>

        {/* Manual navigation button */}
        <Button onClick={() => navigate('/my-subscription')} className="w-full">
          {t('billing.go_to_subscription')}
        </Button>
      </div>
    </div>
  );
}
