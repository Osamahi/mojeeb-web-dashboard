import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAnalytics } from '@/lib/analytics';

/**
 * Addon purchase success page
 *
 * Displayed after successful Stripe checkout redirect for addon purchases.
 * Parses session_id from URL and waits for webhook to process.
 *
 * Flow:
 * 1. User completes checkout on Stripe
 * 2. Stripe redirects to this page with ?session_id=...
 * 3. Webhook processes checkout.session.completed event (addon type)
 * 4. We refresh subscription to show updated limits
 * 5. Show success message and redirect to my subscription
 */
export default function AddonSuccessPage() {
    const { t } = useTranslation();
    useDocumentTitle('addons.success_page_title');
    const navigate = useNavigate();
    const { track } = useAnalytics();
    const [searchParams] = useSearchParams();
    const [countdown, setCountdown] = useState(5);

    const sessionId = searchParams.get('session_id');
    const hasTrackedPurchase = useRef(false);

    // Get current subscription from store (will have updated limits after webhook)
    const subscription = useSubscriptionStore((state) => state.subscription);
    const refreshSubscription = useSubscriptionStore((state) => state.refreshSubscription);
    const isLoadingSubscription = useSubscriptionStore((state) => state.isLoading);

    useEffect(() => {
        // Refresh subscription immediately to get updated limits
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

    // Track addon purchase once (we don't have exact addon details in URL, so track generically)
    useEffect(() => {
        if (subscription && sessionId && !hasTrackedPurchase.current) {
            hasTrackedPurchase.current = true;

            // Track purchase - sends to all analytics providers
            track('addon_purchased', {
                sessionId,
                subscriptionId: subscription.id,
                organizationId: subscription.organizationId,
                paymentMethod: 'stripe',
            });
        }
    }, [subscription, sessionId, track]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
            <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
                {/* Success icon */}
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('addons.purchase_successful')}</h1>

                {/* Message */}
                <p className="text-gray-600 mb-6">
                    {t('addons.purchase_success_message')}
                </p>

                {/* Session ID (for debugging) */}
                {sessionId && (
                    <div className="text-xs text-gray-500 mb-6 p-3 bg-gray-50 rounded font-mono break-all">
                        {t('addons.session_label')} {sessionId}
                    </div>
                )}

                {/* Processing status */}
                {isLoadingSubscription ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('addons.updating_subscription')}</span>
                    </div>
                ) : subscription ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-6 p-3 bg-green-50 rounded">
                        <CheckCircle className="w-4 h-4" />
                        <span>{t('addons.addon_activated')}</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-sm text-amber-600 mb-6 p-3 bg-amber-50 rounded">
                        <AlertCircle className="w-4 h-4" />
                        <span>{t('addons.processing_purchase')}</span>
                    </div>
                )}

                {/* Redirect countdown */}
                <p className="text-sm text-gray-600 mb-6">
                    {t('addons.redirecting_countdown', { countdown })}
                </p>

                {/* Manual navigation button */}
                <Button onClick={() => navigate('/my-subscription')} className="w-full">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {t('addons.view_my_subscription')}
                </Button>
            </div>
        </div>
    );
}
