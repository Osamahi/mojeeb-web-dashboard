import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { subscriptionService } from '../services/subscriptionService';
import { PlanCode, Currency, BillingInterval } from '../types/subscription.types';
import type { CreateSubscriptionRequest } from '../types/subscription.types';
import { BaseModal } from '@/components/ui/BaseModal';
import { toast } from 'sonner';

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateSubscriptionModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSubscriptionRequest>({
    organizationId: '',
    planCode: PlanCode.Starter,
    currency: Currency.USD,
    billingInterval: BillingInterval.Monthly,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.organizationId) {
      toast.error(t('create_subscription.org_id_required'));
      return;
    }

    try {
      setLoading(true);
      await subscriptionService.createSubscription(formData);
      toast.success(t('create_subscription.success'));
      onSuccess();
    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast.error(t('create_subscription.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('create_subscription.title')}
      subtitle={t('create_subscription.subtitle')}
      maxWidth="lg"
      isLoading={loading}
      closable={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('create_subscription.org_id_label')}
              </label>
              <input
                type="text"
                required
                value={formData.organizationId}
                onChange={(e) =>
                  setFormData({ ...formData, organizationId: e.target.value })
                }
                placeholder={t('create_subscription.org_id_placeholder')}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('create_subscription.org_id_hint')}
              </p>
            </div>

            {/* Plan Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('create_subscription.plan_label')}
              </label>
              <select
                value={formData.planCode}
                onChange={(e) =>
                  setFormData({ ...formData, planCode: e.target.value as PlanCode })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value={PlanCode.Free}>{t('create_subscription.plan_free')}</option>
                <option value={PlanCode.Starter}>{t('create_subscription.plan_starter')}</option>
                <option value={PlanCode.Professional}>{t('create_subscription.plan_professional')}</option>
                <option value={PlanCode.Enterprise}>{t('create_subscription.plan_enterprise')}</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('create_subscription.currency_label')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value as Currency })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value={Currency.USD}>{t('create_subscription.currency_usd')}</option>
                <option value={Currency.EGP}>{t('create_subscription.currency_egp')}</option>
                <option value={Currency.SAR}>{t('create_subscription.currency_sar')}</option>
              </select>
            </div>

            {/* Billing Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('create_subscription.interval_label')}
              </label>
              <select
                value={formData.billingInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingInterval: e.target.value as BillingInterval,
                  })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value={BillingInterval.Monthly}>{t('create_subscription.interval_monthly')}</option>
                <option value={BillingInterval.Annual}>{t('create_subscription.interval_annual')}</option>
              </select>
            </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? t('create_subscription.creating') : t('create_subscription.create_button')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
