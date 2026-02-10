/**
 * Addon Quantity Modal
 * Small modal for selecting quantity before purchasing an add-on
 * Displays pricing, allows quantity adjustment, and handles Stripe checkout
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCurrency } from '@/lib/currency';
import type { AddonPlan } from '../types/addon.types';

interface AddonQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  addon: AddonPlan | null;
  onCheckout: (quantity: number) => Promise<void>;
}

export function AddonQuantityModal({
  isOpen,
  onClose,
  addon,
  onCheckout,
}: AddonQuantityModalProps) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { currency, symbol } = useCurrency();

  // Reset quantity when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  // Don't render if no addon selected
  if (!addon) return null;

  const price = addon.pricing?.[currency] || 0;
  const totalPrice = price * quantity;
  const totalUnits = addon.quantity * quantity;
  const unitLabel = addon.addon_type === 'message_credits' ? t('addons.messages_unit') : t('addons.agent_slots_unit');

  // Determine translation key based on addon type and quantity (same as AddonListItem)
  const isPlural = addon.quantity > 1;
  const titleKey = addon.addon_type === 'message_credits'
    ? (isPlural ? 'addons.quantity_messages' : 'addons.quantity_messages_singular')
    : (isPlural ? 'addons.quantity_agents' : 'addons.quantity_agents_singular');

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onCheckout(quantity);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, Math.min(100, val)));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isPlural ? t(titleKey, { quantity: addon.quantity.toLocaleString() }) : t(titleKey)}
      maxWidth="sm"
      isLoading={isLoading}
      closable={!isLoading}
    >
      <div className="space-y-4">
        {/* Quantity input */}
        <div>
          <Input
            type="number"
            label={t('addons.quantity').replace(':', '')}
            value={quantity}
            onChange={handleQuantityChange}
            min={1}
            max={100}
            disabled={isLoading}
          />
        </div>

        {/* Total calculation */}
        <div className="rounded-lg pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">{t('addons.total_units')}</span>
            <span className="font-semibold text-neutral-900">
              {totalUnits.toLocaleString()} {unitLabel}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">{t('addons.total_price').replace(':', '')}</span>
            <div className="flex items-baseline gap-1">
              <span className="font-semibold text-neutral-900">
                {Math.round(totalPrice).toLocaleString()}
              </span>
              <span className="text-sm text-neutral-500">
                {symbol}{t('addons.per_month')}
              </span>
            </div>
          </div>
        </div>

        {/* Availability Note */}
        <p className="text-xs text-neutral-500 text-start pt-2 pb-1 border-t border-neutral-200">
          {t('addons.addon_availability_note')}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {t('addons.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t('addons.pay_with_stripe')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
