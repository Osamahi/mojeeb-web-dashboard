import { Check } from 'lucide-react';
import { memo } from 'react';
import type { SubscriptionPlan } from '../types/subscription.types';
import { PlanFeaturesList } from './PlanFeaturesList';

interface PlanCardProps {
  /** The subscription plan to display */
  plan: SubscriptionPlan;
  /** Whether this is the user's current plan */
  isCurrent: boolean;
  /** Whether this is an upgrade from current plan */
  isUpgrade: boolean;
  /** Whether this is a downgrade from current plan */
  isDowngrade: boolean;
  /** Currency code for pricing (e.g., 'USD', 'SAR') */
  currency: string;
  /** Billing interval for pricing ('monthly' | 'annual') */
  billingInterval: 'monthly' | 'annual';
  /** Callback when plan is selected */
  onSelect: (plan: SubscriptionPlan) => void;
  /** Whether to show "Current Plan" badge */
  showCurrentBadge?: boolean;
  /** Whether clicking current plan is allowed */
  allowSelectCurrent?: boolean;
}

/**
 * PlanCard Component
 *
 * Displays a single subscription plan card with:
 * - Plan name and pricing
 * - Features list
 * - Current plan badge (optional)
 * - Action button (Upgrade/Downgrade/Current/Select)
 *
 * Extracted from duplicate code in:
 * - PlanSelectionGrid
 * - UpgradePlansModal (deleted)
 *
 * Performance optimized with React.memo() to prevent unnecessary re-renders.
 */
export const PlanCard = memo(({
  plan,
  isCurrent,
  isUpgrade,
  isDowngrade,
  currency,
  billingInterval,
  onSelect,
  showCurrentBadge = true,
  allowSelectCurrent = false,
}: PlanCardProps) => {
  const canChange = allowSelectCurrent || !isCurrent;

  const getPrice = () => {
    const pricing = plan.pricing[currency];
    if (!pricing) return 0;
    return billingInterval === 'annual' ? (pricing.annual || 0) : (pricing.monthly || 0);
  };

  const price = getPrice();

  const handleClick = () => {
    if (canChange) {
      onSelect(plan);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to parent div
    if (canChange) {
      onSelect(plan);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative rounded-lg border-2 p-6 transition-all flex flex-col w-full min-w-[200px] ${
        isCurrent
          ? 'border-green-500 bg-green-50'
          : canChange
          ? 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md cursor-pointer'
          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
      }`}
    >
      {/* Current Badge */}
      {isCurrent && showCurrentBadge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
            <Check className="h-3 w-3" />
            Current
          </span>
        </div>
      )}

      {/* Plan Name */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">
            {currency} {price}
          </span>
          <span className="text-sm text-gray-500">
            /{billingInterval === 'annual' ? 'year' : 'mo'}
          </span>
        </div>
      </div>

      {/* Features */}
      <div className="flex-1">
        <PlanFeaturesList
          messageLimit={plan.messageLimit}
          agentLimit={plan.agentLimit}
          features={plan.features}
        />
      </div>

      {/* Action Button */}
      <button
        onClick={handleButtonClick}
        disabled={!allowSelectCurrent && isCurrent}
        className={`w-full rounded-md h-10 px-6 text-base font-medium transition-colors mt-6 ${
          isCurrent
            ? 'bg-green-100 text-green-700 cursor-not-allowed'
            : isUpgrade
            ? 'bg-neutral-950 text-white hover:bg-neutral-900'
            : isDowngrade
            ? 'bg-white text-neutral-950 border border-neutral-300 hover:bg-neutral-50'
            : 'bg-neutral-950 text-white hover:bg-neutral-900'
        }`}
      >
        {isCurrent
          ? 'Current Plan'
          : isUpgrade
          ? 'Upgrade'
          : isDowngrade
          ? 'Downgrade'
          : 'Select Plan'}
      </button>
    </div>
  );
});

PlanCard.displayName = 'PlanCard';
