import { useState, useCallback } from 'react';
import { AlertCircle, Calendar, TrendingUp, Users, MessageSquare, Rocket, Settings, Receipt, CreditCard, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { PlanChangeWizard } from '../components/PlanChangeWizard';
import { ViewInvoicesModal } from '../components/ViewInvoicesModal';
import { PaymentMethodModal } from '../components/PaymentMethodModal';
import { CancelSubscriptionModal } from '@/features/billing/components/CancelSubscriptionModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { differenceInDays } from 'date-fns';
import { useDateLocale } from '@/lib/dateConfig';

export default function MySubscriptionPage() {
  const { t } = useTranslation();
  const { format } = useDateLocale();
  // Read subscription and usage from global store (loaded once on app init)
  const subscription = useSubscriptionStore(state => state.subscription);
  const usage = useSubscriptionStore(state => state.usage);
  const loading = useSubscriptionStore(state => state.isLoading);
  const [showWizard, setShowWizard] = useState(false);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleUpgradeClick = useCallback(() => {
    setShowWizard(true);
  }, []);

  const handleWizardSuccess = useCallback(async () => {
    // Refresh subscription and usage from store
    await useSubscriptionStore.getState().refreshSubscription();
  }, []);

  // Calculate percentages only when data is available
  const daysRemaining = subscription
    ? differenceInDays(new Date(subscription.currentPeriodEnd), new Date())
    : 0;

  const messagePercentage = usage
    ? ((usage.messagesUsed ?? 0) / (usage.messagesLimit ?? 1)) * 100
    : 0;

  const agentPercentage = usage
    ? ((usage.agentsUsed ?? 0) / (usage.agentsLimit ?? 1)) * 100
    : 0;

  // Only check message limit for "approaching limit" warnings
  const isNearLimit = messagePercentage >= 80;

  // Show error state if loading finished but no data
  const hasError = !loading && (!subscription || !usage);

  return (
    <div className="space-y-6 p-6">
      {/* Header - Always visible */}
      <BaseHeader
        title={t('subscriptions.my_title')}
        subtitle={t('subscriptions.my_subtitle')}
        additionalActions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                  <Settings className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowPaymentModal(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t('billing.payment_method')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowInvoicesModal(true)}>
                  <Receipt className="mr-2 h-4 w-4" />
                  {t('billing.view_invoices')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowCancelModal(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  {t('billing.cancel_subscription')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={handleUpgradeClick}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Rocket className="h-4 w-4" />
              {subscription?.planCode === 'free' ? t('subscriptions.upgrade_plan') : t('subscriptions.change_plan')}
            </button>
          </>
        }
      />

      {/* Error State */}
      {hasError && (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">{t('subscriptions.no_subscription_title')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('subscriptions.no_subscription_description')}
            </p>
          </div>
        </div>
      )}

      {/* Content - Show skeletons while loading, real data when loaded */}
      {!hasError && (
        <>
          {/* Warning Banner */}
          {!loading && subscription && (isNearLimit || subscription.isFlaggedNonPaying) && (
        <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                {subscription.isFlaggedNonPaying
                  ? t('subscriptions.warning_non_payment')
                  : t('subscriptions.warning_approaching_limit')}
              </p>
            </div>
          </div>
        </div>
          )}

          {/* Subscription Details Card */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">{t('subscriptions.current_plan')}</h2>
            </div>
            <div className="p-6">
              {loading ? (
                /* Skeleton Loading State */
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 w-32 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : subscription ? (
                /* Real Data */
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {/* Plan Name */}
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('subscriptions.plan_label')}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {subscription.planName}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{subscription.planCode}</p>
                  </div>

                  {/* Billing */}
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('subscriptions.billing_label')}</p>
                    {subscription.amount === 0 ? (
                      <>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">{t('subscriptions.billing_free')}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {subscription.billingInterval === 'monthly' ? t('subscriptions.billing_monthly') : t('subscriptions.billing_annual')}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-2xl font-semibold text-gray-900">
                            {subscription.amount.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {subscription.currency}/{subscription.billingInterval === 'monthly' ? t('subscriptions.billing_per_month') : t('subscriptions.billing_per_year')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('subscriptions.status_label')}</p>
                    <div className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          subscription.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : subscription.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {subscription.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {subscription.paymentMethod}
                    </p>
                  </div>

                  {/* Next Renewal */}
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('subscriptions.next_renewal_label')}</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('subscriptions.days_remaining', { days: daysRemaining })}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">{t('subscriptions.usage_statistics')}</h2>
            </div>
            <div className="p-6">
              {loading ? (
                /* Skeleton Loading State */
                <div className="space-y-6 animate-pulse">
                  {/* Period skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-64 bg-gray-200 rounded"></div>
                  </div>

                  {/* Usage metrics skeletons */}
                  {[...Array(2)].map((_, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 bg-gray-200 rounded"></div>
                          <div className="h-4 w-20 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded mt-1"></div>
                    </div>
                  ))}
                </div>
              ) : usage ? (
                /* Real Data */
                <>
                  {/* Billing Period */}
                  <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t('subscriptions.current_period', {
                        start: format(new Date(usage.periodStart), 'MMM d'),
                        end: format(new Date(usage.periodEnd), 'MMM d, yyyy')
                      })}
                    </span>
                  </div>

                  {/* Usage Metrics */}
                  <div className="space-y-6">
                    {/* Messages Usage */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {t('subscriptions.messages_label')}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {(usage.messagesUsed ?? 0).toLocaleString()} /{' '}
                          {(usage.messagesLimit ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${Math.min(messagePercentage, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {t('subscriptions.usage_percentage', { percentage: (usage.messageUsagePercentage ?? 0).toFixed(1) })}
                      </p>
                    </div>

                    {/* Agents Usage */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{t('subscriptions.agents_label')}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {usage.agentsUsed ?? 0} / {usage.agentsLimit ?? 0}
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${Math.min(agentPercentage, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {t('subscriptions.usage_percentage', { percentage: agentPercentage.toFixed(1) })}
                      </p>
                    </div>
                  </div>

                  {/* Upgrade Prompt */}
                  {isNearLimit && (
                    <div className="mt-6 rounded-lg bg-green-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">
                            {t('subscriptions.ready_to_scale')}
                          </h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>
                              {t('subscriptions.upgrade_prompt', { percentage: messagePercentage.toFixed(0) })}
                            </p>
                          </div>
                          <div className="mt-4">
                            <button
                              onClick={handleUpgradeClick}
                              className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                            >
                              {t('subscriptions.view_upgrade_options')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* Plan Change Wizard */}
      {subscription && (
        <PlanChangeWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          currentSubscription={subscription}
          onSuccess={handleWizardSuccess}
        />
      )}

      {/* Billing Modals */}
      <ViewInvoicesModal
        isOpen={showInvoicesModal}
        onClose={() => setShowInvoicesModal(false)}
      />
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
      />
    </div>
  );
}
