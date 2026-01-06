import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BarChart3, MessageSquare, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionDetails } from '../types/subscription.types';

interface ViewUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionDetails;
}

export function ViewUsageModal({ isOpen, onClose, subscription }: ViewUsageModalProps) {
  const { t } = useTranslation();

  const { data: usage, isLoading, error } = useQuery({
    queryKey: ['subscription-usage', subscription.id],
    queryFn: () => subscriptionService.getSubscriptionUsage(subscription.id),
    enabled: isOpen,
    staleTime: 0, // Data is immediately stale
    gcTime: 0, // Don't cache (formerly cacheTime)
    refetchOnMount: 'always', // Always refetch when modal opens
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 75) return 'text-orange-600 bg-orange-50';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('subscriptions.usage_modal.title')}
      subtitle={`${subscription.organizationName} - ${subscription.planName}`}
      maxWidth="lg"
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {t('subscriptions.usage_modal.error_loading')}
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {error instanceof Error ? error.message : t('common.unknown_error')}
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <>
            {/* Messages Usage Skeleton */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-200 h-10 w-10" />
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-32 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="h-6 w-12 bg-gray-200 rounded-full" />
              </div>

              {/* Progress Bar Skeleton */}
              <div className="mb-3">
                <div className="h-3 w-full rounded-full bg-gray-200" />
              </div>

              {/* Stats Skeleton */}
              <div className="grid grid-cols-3 gap-4 text-center">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-8 w-16 bg-gray-200 rounded mx-auto mb-2" />
                    <div className="h-3 w-12 bg-gray-100 rounded mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Agents Usage Skeleton */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-200 h-10 w-10" />
                  <div>
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-28 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="h-6 w-12 bg-gray-200 rounded-full" />
              </div>

              {/* Progress Bar Skeleton */}
              <div className="mb-3">
                <div className="h-3 w-full rounded-full bg-gray-200" />
              </div>

              {/* Stats Skeleton */}
              <div className="grid grid-cols-3 gap-4 text-center">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-8 w-16 bg-gray-200 rounded mx-auto mb-2" />
                    <div className="h-3 w-12 bg-gray-100 rounded mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Period Skeleton */}
            <div className="rounded-lg bg-gray-50 p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded mt-0.5" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-40 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          </>
        )}

        {!isLoading && usage && (
          <>
            {/* Messages Usage */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {t('subscriptions.usage_modal.messages')}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {t('subscriptions.usage_modal.current_billing_period')}
                    </p>
                  </div>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-medium ${getUsageColor(usage.messageUsagePercentage)}`}>
                  {usage.messageUsagePercentage.toFixed(1)}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressColor(usage.messageUsagePercentage)}`}
                    style={{ width: `${Math.min(usage.messageUsagePercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(usage.messagesUsed)}</p>
                  <p className="text-xs text-gray-500">{t('subscriptions.usage_modal.used')}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(usage.messagesRemaining)}</p>
                  <p className="text-xs text-gray-500">{t('subscriptions.usage_modal.remaining')}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(usage.messagesLimit)}</p>
                  <p className="text-xs text-gray-500">{t('subscriptions.usage_modal.limit')}</p>
                </div>
              </div>

              {usage.isNearLimit && (
                <div className="mt-4 rounded-md bg-orange-50 p-3">
                  <div className="flex">
                    <TrendingUp className="h-5 w-5 text-orange-400" />
                    <p className="ml-2 text-sm text-orange-700">
                      {t('subscriptions.usage_modal.approaching_limit')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Agents Usage */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2.5">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {t('subscriptions.usage_modal.agents')}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {t('subscriptions.usage_modal.active_agents')}
                    </p>
                  </div>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-medium ${getUsageColor((usage.agentsUsed / usage.agentsLimit) * 100)}`}>
                  {((usage.agentsUsed / usage.agentsLimit) * 100).toFixed(1)}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressColor((usage.agentsUsed / usage.agentsLimit) * 100)}`}
                    style={{ width: `${Math.min((usage.agentsUsed / usage.agentsLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{usage.agentsUsed}</p>
                  <p className="text-xs text-gray-500">{t('subscriptions.usage_modal.used')}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{usage.agentsRemaining}</p>
                  <p className="text-xs text-gray-500">{t('subscriptions.usage_modal.remaining')}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{usage.agentsLimit}</p>
                  <p className="text-xs text-gray-500">{t('subscriptions.usage_modal.limit')}</p>
                </div>
              </div>
            </div>

            {/* Subscription Period Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    {t('subscriptions.usage_modal.billing_period')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('subscriptions.usage_modal.resets_on')} {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
