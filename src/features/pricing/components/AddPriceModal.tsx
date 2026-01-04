/**
 * Modal for creating a new Stripe price for a product.
 * SuperAdmin-only feature.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import type {
  CreateStripePriceRequest,
  StripeEnvironmentMode,
  Currency,
  BillingInterval,
} from '../types/pricing.types';

export interface AddPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (priceData: CreateStripePriceRequest) => void;
  productId: string;
  productName: string;
  environmentMode: StripeEnvironmentMode;
  isLoading?: boolean;
}

export function AddPriceModal({
  isOpen,
  onClose,
  onSubmit,
  productId,
  productName,
  environmentMode,
  isLoading = false,
}: AddPriceModalProps) {
  const { t } = useTranslation();

  // Form state
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD' as Currency);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly' as BillingInterval);
  const [isActive, setIsActive] = useState(true);

  // Form validation
  const [errors, setErrors] = useState<{ amount?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    const amountNum = parseFloat(amount);
    if (!amount.trim()) {
      newErrors.amount = t('pricing.validation.amount_required');
    } else if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = t('pricing.validation.amount_positive');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Convert amount to cents/smallest currency unit
    const amountInCents = Math.round(parseFloat(amount) * 100);

    onSubmit({
      productId,
      amount: amountInCents,
      currency,
      billingInterval,
      isActive,
    });

    // Reset form
    setAmount('');
    setCurrency('USD' as Currency);
    setBillingInterval('monthly' as BillingInterval);
    setIsActive(true);
    setErrors({});
  };

  const handleClose = () => {
    if (!isLoading) {
      setAmount('');
      setCurrency('USD' as Currency);
      setBillingInterval('monthly' as BillingInterval);
      setIsActive(true);
      setErrors({});
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('pricing.add_price_title')}
      subtitle={t('pricing.add_price_subtitle', { product: productName })}
      maxWidth="md"
      isLoading={isLoading}
      closable={!isLoading}
    >
      <div className="space-y-6">
        {/* Amount */}
        <div className="space-y-2">
          <label htmlFor="price-amount" className="block text-sm font-medium text-gray-700">
            {t('pricing.field.amount')} <span className="text-red-500">*</span>
          </label>
          <Input
            id="price-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('pricing.placeholder.amount')}
            disabled={isLoading}
            className={errors.amount ? 'border-red-500' : ''}
          />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
          <p className="text-xs text-gray-500">{t('pricing.help.amount')}</p>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <label htmlFor="price-currency" className="block text-sm font-medium text-gray-700">
            {t('pricing.field.currency')} <span className="text-red-500">*</span>
          </label>
          <select
            id="price-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="USD">{t('pricing.currency.usd')}</option>
            <option value="EGP">{t('pricing.currency.egp')}</option>
            <option value="SAR">{t('pricing.currency.sar')}</option>
          </select>
          <p className="text-xs text-gray-500">{t('pricing.help.currency')}</p>
        </div>

        {/* Billing Interval */}
        <div className="space-y-2">
          <label htmlFor="price-interval" className="block text-sm font-medium text-gray-700">
            {t('pricing.field.billing_interval')} <span className="text-red-500">*</span>
          </label>
          <select
            id="price-interval"
            value={billingInterval}
            onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="monthly">{t('pricing.interval.monthly')}</option>
            <option value="annual">{t('pricing.interval.annual')}</option>
          </select>
          <p className="text-xs text-gray-500">{t('pricing.help.billing_interval')}</p>
        </div>

        {/* Active Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label htmlFor="price-active" className="text-sm font-medium text-gray-700">
              {t('pricing.field.active')}
            </label>
            <p className="text-xs text-gray-500 mt-1">{t('pricing.help.price_active')}</p>
          </div>
          <Switch
            id="price-active"
            checked={isActive}
            onChange={setIsActive}
            disabled={isLoading}
          />
        </div>

        {/* Information Note */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('pricing.note_title')}:</strong> {t('pricing.note_recurring_flat_rate')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} isLoading={isLoading} className="flex-1">
            {isLoading ? t('pricing.creating_price') : t('pricing.create_price')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
