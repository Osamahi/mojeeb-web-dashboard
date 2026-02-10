/**
 * Addon List Item Component
 * Displays a single add-on in a list-style layout with purchase action
 * Used on My Subscription page to show available add-ons
 */

import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/lib/currency';
import type { AddonPlan } from '../types/addon.types';

interface AddonListItemProps {
  addon: AddonPlan;
  onPurchase: () => void;
}

export function AddonListItem({ addon, onPurchase }: AddonListItemProps) {
  const { t } = useTranslation();
  const { currency, symbol } = useCurrency();
  const price = addon.pricing?.[currency];

  // Determine translation key based on addon type and quantity
  const isPlural = addon.quantity > 1;
  const titleKey = addon.addon_type === 'message_credits'
    ? (isPlural ? 'addons.quantity_messages' : 'addons.quantity_messages_singular')
    : (isPlural ? 'addons.quantity_agents' : 'addons.quantity_agents_singular');

  // Don't render if no price available for current currency
  if (!price) return null;

  return (
    <button
      type="button"
      onClick={onPurchase}
      className="w-full rounded-lg border border-neutral-200 bg-white p-6 text-start hover:border-neutral-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-6">
        {/* Left: Content */}
        <div className="flex-1 min-w-0">
          {/* Title - Dynamic based on addon type and quantity */}
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            {isPlural ? t(titleKey, { quantity: addon.quantity.toLocaleString() }) : t(titleKey)}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-medium text-neutral-900">
              {Math.round(price).toLocaleString()}
            </span>
            <span className="text-sm text-neutral-500">
              {symbol}{t('addons.per_month')}
            </span>
          </div>
        </div>

        {/* Right: Add Badge */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700">
            {t('addons.add_button')}
          </span>
        </div>
      </div>
    </button>
  );
}
