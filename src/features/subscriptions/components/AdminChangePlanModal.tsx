/**
 * Admin Change Plan Modal
 * Allows SuperAdmin to manually change a subscription's plan (upgrade/downgrade)
 * Simpler than customer wizard - no payment flow, direct plan change
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { BaseModal } from '@/components/ui/BaseModal';
import { toast } from 'sonner';
import { subscriptionService } from '../services/subscriptionService';
import { PlanCode, Currency, BillingInterval } from '../types/subscription.types';
import type { SubscriptionDetails } from '../types/subscription.types';

interface AdminChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  subscription: SubscriptionDetails;
}

export function AdminChangePlanModal({
  isOpen,
  onClose,
  onSuccess,
  subscription,
}: AdminChangePlanModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<PlanCode>(subscription.planCode as PlanCode);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(subscription.currency as Currency);
  const [selectedBillingInterval, setSelectedBillingInterval] = useState<BillingInterval>(
    subscription.billingInterval as BillingInterval
  );

  // Reset form when subscription changes
  useEffect(() => {
    if (isOpen) {
      setSelectedPlan(subscription.planCode as PlanCode);
      setSelectedCurrency(subscription.currency as Currency);
      setSelectedBillingInterval(subscription.billingInterval as BillingInterval);
    }
  }, [isOpen, subscription]);

  // Fetch plans to show new limits
  const { data: plans = [] } = useQuery({
    queryKey: ['plans', selectedCurrency],
    queryFn: () => subscriptionService.getPlans(),
    enabled: isOpen,
  });

  // Find new plan details
  const newPlan = plans.find((p) => p.code === selectedPlan);

  // Check if anything changed
  const hasChanges =
    selectedPlan !== subscription.planCode ||
    selectedCurrency !== subscription.currency ||
    selectedBillingInterval !== subscription.billingInterval;

  // Mutation for changing plan
  const changePlanMutation = useMutation({
    mutationFn: () =>
      subscriptionService.adminChangePlan(
        subscription.id,
        selectedPlan,
        selectedCurrency,
        selectedBillingInterval
      ),
    onSuccess: () => {
      toast.success(
        t('admin_change_plan.success', 'Subscription plan changed successfully')
      );
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      onSuccess?.(); // Trigger parent refresh
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to change plan:', error);
      toast.error(
        t(
          'admin_change_plan.error',
          error.response?.data?.message || 'Failed to change subscription plan'
        )
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) {
      toast.info(t('admin_change_plan.no_changes', 'No changes made'));
      return;
    }
    changePlanMutation.mutate();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin_change_plan.title', 'Change Subscription Plan')}
      subtitle={t(
        'admin_change_plan.subtitle',
        `Modify subscription for ${subscription.organizationName}`
      )}
      maxWidth="lg"
      isLoading={changePlanMutation.isPending}
      closable={!changePlanMutation.isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Plan Info */}
        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-900 mb-2">
            {t('admin_change_plan.current_plan', 'Current Plan')}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-500">Plan:</span>
              <span className="ml-2 font-medium">{subscription.planName}</span>
            </div>
            <div>
              <span className="text-neutral-500">Currency:</span>
              <span className="ml-2 font-medium">{subscription.currency}</span>
            </div>
            <div>
              <span className="text-neutral-500">Billing:</span>
              <span className="ml-2 font-medium capitalize">{subscription.billingInterval}</span>
            </div>
            <div>
              <span className="text-neutral-500">Amount:</span>
              <span className="ml-2 font-medium">
                {subscription.currency} {subscription.amount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">Messages:</span>
              <span className="ml-2 font-medium">{subscription.messageLimit.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-neutral-500">Agents:</span>
              <span className="ml-2 font-medium">{subscription.agentLimit}</span>
            </div>
          </div>
        </div>

        {/* New Plan Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-900">
            {t('admin_change_plan.new_plan', 'New Plan Configuration')}
          </h3>

          {/* Plan Dropdown */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('admin_change_plan.plan_label', 'Plan')}
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as PlanCode)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value={PlanCode.Free}>{t('plans.free', 'Free')}</option>
              <option value={PlanCode.Starter}>{t('plans.starter', 'Starter')}</option>
              <option value={PlanCode.Professional}>{t('plans.professional', 'Professional')}</option>
            </select>
          </div>

          {/* Currency Dropdown */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('admin_change_plan.currency_label', 'Currency')}
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value={Currency.USD}>{t('currency.usd', 'USD')}</option>
              <option value={Currency.EGP}>{t('currency.egp', 'EGP')}</option>
              <option value={Currency.SAR}>{t('currency.sar', 'SAR')}</option>
            </select>
          </div>

          {/* Billing Interval Dropdown */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('admin_change_plan.billing_interval_label', 'Billing Interval')}
            </label>
            <select
              value={selectedBillingInterval}
              onChange={(e) => setSelectedBillingInterval(e.target.value as BillingInterval)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value={BillingInterval.Monthly}>{t('billing.monthly', 'Monthly')}</option>
              <option value={BillingInterval.Annual}>{t('billing.annual', 'Annual')}</option>
            </select>
          </div>
        </div>

        {/* New Plan Preview */}
        {newPlan && hasChanges && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-900 mb-2">
              {t('admin_change_plan.new_limits', 'New Plan Limits')}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-green-700">Messages:</span>
                <span className="ml-2 font-medium text-green-900">
                  {newPlan.messageLimit.toLocaleString()}
                </span>
                {newPlan.messageLimit > subscription.messageLimit && (
                  <span className="ml-1 text-xs text-green-600">↑ Upgrade</span>
                )}
                {newPlan.messageLimit < subscription.messageLimit && (
                  <span className="ml-1 text-xs text-orange-600">↓ Downgrade</span>
                )}
              </div>
              <div>
                <span className="text-green-700">Agents:</span>
                <span className="ml-2 font-medium text-green-900">{newPlan.agentLimit}</span>
                {newPlan.agentLimit > subscription.agentLimit && (
                  <span className="ml-1 text-xs text-green-600">↑ Upgrade</span>
                )}
                {newPlan.agentLimit < subscription.agentLimit && (
                  <span className="ml-1 text-xs text-orange-600">↓ Downgrade</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={changePlanMutation.isPending}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={changePlanMutation.isPending || !hasChanges}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {changePlanMutation.isPending
              ? t('admin_change_plan.changing', 'Changing...')
              : t('admin_change_plan.change_button', 'Change Plan')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
