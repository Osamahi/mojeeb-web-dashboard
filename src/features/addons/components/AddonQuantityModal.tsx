/**
 * Addon Quantity Modal
 * Small modal for selecting quantity before purchasing an add-on
 * Displays pricing, allows quantity adjustment, and handles Stripe checkout
 */

import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
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
  const unitLabel = addon.addon_type === 'message_credits' ? 'messages' : 'agent slots';

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
      title={addon.name}
      subtitle={addon.description}
      maxWidth="sm"
      isLoading={isLoading}
      closable={!isLoading}
    >
      <div className="space-y-4">
        {/* Addon details */}
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-sm space-y-1">
          <p className="text-neutral-600">
            {addon.quantity.toLocaleString()} {unitLabel} per unit
          </p>
          <p className="text-neutral-600">
            {symbol}
            {price.toFixed(2)} per unit
          </p>
        </div>

        {/* Quantity input */}
        <div>
          <Input
            type="number"
            label="Quantity"
            value={quantity}
            onChange={handleQuantityChange}
            min={1}
            max={100}
            disabled={isLoading}
          />
          <p className="text-xs text-neutral-500 mt-1">
            Select quantity (1-100 units)
          </p>
        </div>

        {/* Total calculation */}
        <div className="rounded-lg border-t border-neutral-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Total Units</span>
            <span className="font-semibold text-neutral-900">
              {totalUnits.toLocaleString()} {unitLabel}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-neutral-600">Total Price</span>
            <span className="text-2xl font-bold text-neutral-900">
              {symbol}
              {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay with Stripe
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
