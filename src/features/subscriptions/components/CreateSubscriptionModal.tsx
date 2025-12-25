import { useState } from 'react';
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
      toast.error('Organization ID is required');
      return;
    }

    try {
      setLoading(true);
      await subscriptionService.createSubscription(formData);
      toast.success('Subscription created successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast.error('Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Subscription"
      subtitle="Create a new subscription for an organization"
      maxWidth="lg"
      isLoading={loading}
      closable={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization ID *
              </label>
              <input
                type="text"
                required
                value={formData.organizationId}
                onChange={(e) =>
                  setFormData({ ...formData, organizationId: e.target.value })
                }
                placeholder="Enter organization UUID"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                UUID of the organization to create subscription for
              </p>
            </div>

            {/* Plan Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Plan *
              </label>
              <select
                value={formData.planCode}
                onChange={(e) =>
                  setFormData({ ...formData, planCode: e.target.value as PlanCode })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value={PlanCode.Free}>Free (300 msgs/mo, 1 agent)</option>
                <option value={PlanCode.Starter}>Starter</option>
                <option value={PlanCode.Professional}>Professional</option>
                <option value={PlanCode.Enterprise}>Enterprise</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency *
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value as Currency })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value={Currency.USD}>USD - US Dollar</option>
                <option value={Currency.EGP}>EGP - Egyptian Pound</option>
                <option value={Currency.SAR}>SAR - Saudi Riyal</option>
              </select>
            </div>

            {/* Billing Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Billing Interval *
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
                <option value={BillingInterval.Monthly}>Monthly</option>
                <option value={BillingInterval.Annual}>Annual</option>
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Subscription'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
