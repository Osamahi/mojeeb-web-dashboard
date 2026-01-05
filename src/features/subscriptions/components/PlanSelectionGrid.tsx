import { memo } from 'react';
import { usePlanStore } from '../stores/planStore';
import type { SubscriptionPlan } from '../types/subscription.types';
import { PlanCard } from './PlanCard';
import { PlanCode } from '../types/subscription.types';

interface PlanSelectionGridProps {
  /** Current subscription plan code to highlight */
  currentPlanCode?: string;
  /** Current subscription message limit for upgrade/downgrade detection */
  currentMessageLimit?: number;
  /** Currency to display prices in */
  currency: string;
  /** Billing interval for pricing */
  billingInterval?: 'monthly' | 'annual';
  /** Callback when a plan is selected */
  onSelectPlan: (plan: SubscriptionPlan) => void;
  /** Optional: Show current plan badge */
  showCurrentBadge?: boolean;
  /** Optional: Allow clicking current plan */
  allowSelectCurrent?: boolean;
}

export const PlanSelectionGrid = memo(function PlanSelectionGrid({
  currentPlanCode,
  currentMessageLimit,
  currency,
  billingInterval = 'monthly',
  onSelectPlan,
  showCurrentBadge = true,
  allowSelectCurrent = false,
}: PlanSelectionGridProps) {
  // Read plans from global store (loaded once on app init)
  const allPlans = usePlanStore(state => state.plans);
  const loading = usePlanStore(state => state.isLoading);
  const error = usePlanStore(state => state.error);

  // Filter to show only production plans (exclude legacy and test plans)
  const productionPlanCodes = [PlanCode.Free, PlanCode.Starter, PlanCode.Professional];
  const plans = allPlans.filter(plan => productionPlanCodes.includes(plan.code as any));

  // Show loading skeleton if still loading OR if plans not loaded yet
  const showLoading = loading || allPlans.length === 0;

  return (
    <div className="lg:w-fit lg:mx-auto">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {showLoading ? (
          // Skeleton loading cards (3 production plans)
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border-2 border-gray-200 bg-white p-6 animate-pulse flex flex-col w-full min-w-[200px]"
            >
              <div className="mb-4">
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="mb-4">
                <div className="h-8 w-32 bg-gray-300 rounded"></div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 w-full bg-gray-200 rounded mt-6"></div>
            </div>
          ))
        ) : (
          plans.map((plan) => {
            const isCurrent = plan.code === currentPlanCode;
            const isUpgrade = currentMessageLimit
              ? plan.messageLimit > currentMessageLimit
              : false;
            const isDowngrade = currentMessageLimit
              ? plan.messageLimit < currentMessageLimit
              : false;

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={isCurrent}
                isUpgrade={isUpgrade}
                isDowngrade={isDowngrade}
                currency={currency}
                billingInterval={billingInterval}
                onSelect={onSelectPlan}
                showCurrentBadge={showCurrentBadge}
                allowSelectCurrent={allowSelectCurrent}
              />
            );
          })
        )}
      </div>
    </div>
  );
});
