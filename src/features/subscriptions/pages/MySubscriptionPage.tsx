import { useState, useCallback } from 'react';
import { AlertCircle, Calendar, TrendingUp, Users, MessageSquare, Rocket } from 'lucide-react';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { PlanChangeWizard } from '../components/PlanChangeWizard';
import { format, differenceInDays } from 'date-fns';

export default function MySubscriptionPage() {
  // Read subscription and usage from global store (loaded once on app init)
  const subscription = useSubscriptionStore(state => state.subscription);
  const usage = useSubscriptionStore(state => state.usage);
  const loading = useSubscriptionStore(state => state.isLoading);
  const [showWizard, setShowWizard] = useState(false);

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
        title="My Subscription"
        subtitle="Manage your plan and view usage statistics"
        primaryAction={{
          label: subscription?.planCode === 'free' ? "Upgrade Plan" : "Change Plan",
          icon: Rocket,
          onClick: handleUpgradeClick
        }}
      />

      {/* Error State */}
      {hasError && (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No subscription found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact your administrator to set up a subscription
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
                  ? 'Your subscription has been flagged for non-payment. Please contact support.'
                  : 'You are approaching your message limit. Consider upgrading your plan.'}
              </p>
            </div>
          </div>
        </div>
          )}

          {/* Subscription Details Card */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Current Plan</h2>
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
                    <p className="text-sm font-medium text-gray-500">Plan</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {subscription.planName}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{subscription.planCode}</p>
                  </div>

                  {/* Billing */}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Billing</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {subscription.currency} {subscription.amount.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {subscription.amount === 0 ? 'free' : `per ${subscription.billingInterval === 'monthly' ? 'month' : 'year'}`}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
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
                    <p className="text-sm font-medium text-gray-500">Next Renewal</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {daysRemaining} days remaining
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Usage Statistics</h2>
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
                      Current period: {format(new Date(usage.periodStart), 'MMM d')} -{' '}
                      {format(new Date(usage.periodEnd), 'MMM d, yyyy')}
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
                            Messages
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
                        {(usage.messageUsagePercentage ?? 0).toFixed(1)}% used
                      </p>
                    </div>

                    {/* Agents Usage */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Agents</span>
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
                        {agentPercentage.toFixed(1)}% used
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
                            Ready to scale?
                          </h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>
                              You're using {messagePercentage.toFixed(0)}% of your message limit.
                              Upgrade to get more capacity and unlock advanced features.
                            </p>
                          </div>
                          <div className="mt-4">
                            <button
                              onClick={handleUpgradeClick}
                              className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                            >
                              View Upgrade Options
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
    </div>
  );
}
