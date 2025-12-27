/**
 * Sidebar Usage Indicator Component
 * Shows message usage progress bar with upgrade link
 * Displayed at the bottom of the sidebar
 */

import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { useUIStore } from '@/stores/uiStore';

export const SidebarUsageIndicator = () => {
  const { t } = useTranslation();

  // Read subscription and usage from global store (loaded once on app init)
  const subscription = useSubscriptionStore(state => state.subscription);
  const usage = useSubscriptionStore(state => state.usage);
  const loadingSubscription = useSubscriptionStore(state => state.isLoading);

  // Use UI store for modal state
  const setShowUpgradeWizard = useUIStore(state => state.setShowUpgradeWizard);

  // Check if user is on free plan
  const isFreePlan = subscription?.planCode?.toLowerCase() === 'free';

  // Calculate message usage percentage
  const messagePercentage = usage
    ? ((usage.messagesUsed ?? 0) / (usage.messagesLimit ?? 1)) * 100
    : 0;

  // Determine if usage is critical (95% or above)
  const isCriticalUsage = messagePercentage >= 95;

  // Show skeleton while loading
  if (loadingSubscription) {
    return (
      <div className="mt-auto p-4 bg-white">
        <div className="p-3 border border-neutral-200 rounded-lg animate-pulse">
          <div className="h-1 w-full bg-neutral-200 rounded-full mb-2"></div>
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-neutral-200 rounded"></div>
            <div className="h-3 w-12 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no usage data
  if (!usage) {
    return null;
  }

  return (
    <div className="mt-auto p-4 bg-white">
      {/* Message Usage Card */}
      <div className="p-3 border border-neutral-200 rounded-lg">
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-neutral-100 mb-2">
          <div
            className={`h-full transition-all duration-300 ${
              isCriticalUsage ? 'bg-red-600' : 'bg-green-600'
            }`}
            style={{ width: `${Math.min(messagePercentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-xs font-medium text-neutral-600">
              {(usage.messagesUsed ?? 0).toLocaleString()}/{(usage.messagesLimit ?? 0).toLocaleString()}
            </span>
          </div>
          {/* Upgrade link - Only show for free plan users */}
          {isFreePlan && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUpgradeWizard(true);
              }}
              className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              {t('sidebar.upgrade')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
