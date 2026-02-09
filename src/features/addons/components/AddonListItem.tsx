/**
 * Addon List Item Component
 * Displays a single add-on in a list-style layout with purchase action
 * Used on My Subscription page to show available add-ons
 */

import { useCurrency } from '@/lib/currency';
import type { AddonPlan } from '../types/addon.types';

interface AddonListItemProps {
  addon: AddonPlan;
  onPurchase: () => void;
}

export function AddonListItem({ addon, onPurchase }: AddonListItemProps) {
  const { currency, symbol } = useCurrency();
  const price = addon.pricing?.[currency];
  const unitLabel = addon.addon_type === 'message_credits' ? 'messages' : 'agent slots';

  // Don't render if no price available for current currency
  if (!price) return null;

  return (
    <button
      type="button"
      onClick={onPurchase}
      className="w-full rounded-lg border border-neutral-200 bg-white p-6 text-left hover:border-neutral-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-6">
        {/* Left: Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            {addon.name}
          </h3>

          {/* Price */}
          <p className="text-sm font-medium text-neutral-900 mb-2">
            {symbol}
            {price.toFixed(2)} per {addon.quantity.toLocaleString()} {unitLabel}
          </p>

          {/* Description */}
          {addon.description && (
            <p className="text-sm text-neutral-600 leading-relaxed">
              {addon.description}
            </p>
          )}
        </div>

        {/* Right: Purchase Badge */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700">
            Purchase
          </span>
        </div>
      </div>
    </button>
  );
}
