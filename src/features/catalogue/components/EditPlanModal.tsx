import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { BaseModal } from '@/components/ui/BaseModal';
import { useUpdatePlanMutation } from '../hooks/useUpdatePlanMutation';
import { catalogueService } from '../services/catalogueService';
import type { PlanCatalogueItem, PlanCatalogueDetail, UpdatePlanRequest, Currency, BillingInterval } from '../types/catalogue.types';

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanCatalogueItem;
}

export function EditPlanModal({ isOpen, onClose, plan }: EditPlanModalProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdatePlanMutation();

  // Fetch full plan details including pricing
  const { data: planDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['planDetails', plan.id],
    queryFn: () => catalogueService.getPlanById(plan.id),
    enabled: isOpen,
  });

  const [formData, setFormData] = useState<UpdatePlanRequest>({
    name: plan.name,
    description: plan.description || '',
    messageLimit: plan.messageLimit,
    agentLimit: plan.agentLimit,
    pricing: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isStripeExpanded, setIsStripeExpanded] = useState(false); // Collapsed by default
  const [isStripeProductExpanded, setIsStripeProductExpanded] = useState(false); // Stripe Product section
  const [syncToStripe, setSyncToStripe] = useState(false); // Checkbox for syncing to Stripe

  // Stripe product data state
  const [stripeProductData, setStripeProductData] = useState({
    name: '',
    description: '',
  });

  // Update form when plan details are loaded
  useEffect(() => {
    if (planDetails) {
      setFormData({
        name: planDetails.name,
        description: planDetails.description || '',
        messageLimit: planDetails.messageLimit,
        agentLimit: planDetails.agentLimit,
        pricing: planDetails.pricing || {},
      });

      // Populate Stripe product data if available
      if (planDetails.stripeProductId) {
        setStripeProductData({
          name: planDetails.stripeProductName || '',
          description: planDetails.stripeProductDescription || '',
        });
      }
    }
  }, [planDetails]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.name && !formData.name.trim()) {
      newErrors.name = t('catalogue.editModal.errors.nameRequired');
    }

    if (formData.messageLimit !== undefined && formData.messageLimit < 0) {
      newErrors.messageLimit = t('catalogue.editModal.errors.messageLimitInvalid');
    }

    if (formData.agentLimit !== undefined && formData.agentLimit < 0) {
      newErrors.agentLimit = t('catalogue.editModal.errors.agentLimitInvalid');
    }

    // Validate pricing
    if (formData.pricing) {
      Object.entries(formData.pricing).forEach(([currency, intervals]) => {
        if (intervals.monthly !== undefined && intervals.monthly < 0) {
          newErrors[`pricing_${currency}_monthly`] = `${currency} monthly price must be 0 or greater`;
        }
        if (intervals.annual !== undefined && intervals.annual < 0) {
          newErrors[`pricing_${currency}_annual`] = `${currency} annual price must be 0 or greater`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const updateRequest: UpdatePlanRequest = {
        ...formData,
        // Add Stripe product fields if checkbox is checked
        ...(syncToStripe && planDetails?.stripeProductId && {
          stripeProductName: stripeProductData.name,
          stripeProductDescription: stripeProductData.description,
          syncToStripe: true,
        }),
      };

      await updateMutation.mutateAsync({
        id: plan.id,
        request: updateRequest,
      });
      onClose();
    } catch (error) {
      // Error toast handled by mutation
      console.error('[EditPlanModal] Update failed:', error);
    }
  };

  const handleChange = (field: keyof UpdatePlanRequest, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePricingChange = (currency: Currency, interval: BillingInterval, value: number) => {
    setFormData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [currency]: {
          ...(prev.pricing?.[currency] || {}),
          [interval]: value,
        },
      },
    }));

    // Clear error for this pricing field
    const errorKey = `pricing_${currency}_${interval}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleCopyPriceId = async (priceId: string) => {
    try {
      await navigator.clipboard.writeText(priceId);
      toast.success('Stripe Price ID copied!');
    } catch (error) {
      toast.error('Failed to copy Price ID');
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('catalogue.editModal.title')}
      subtitle={t('catalogue.editModal.subtitle', { planName: plan.name })}
      maxWidth="lg"
      isLoading={updateMutation.isPending}
      closable={!updateMutation.isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plan Code (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            {t('catalogue.editModal.fields.code')}
          </label>
          <div className="mt-1">
            <span className="text-sm text-neutral-500">
              {plan.code}
            </span>
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            {t('catalogue.editModal.sections.basicInfo')}
          </h3>

          {/* Plan Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
              {t('catalogue.editModal.fields.name')} <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`mt-1 block w-full rounded-lg border ${
                errors.name ? 'border-danger-300' : 'border-neutral-300'
              } px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
              disabled={updateMutation.isPending}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
              {t('catalogue.editModal.fields.description')}
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled={updateMutation.isPending}
            />
          </div>
        </div>

        {/* Limits */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            {t('catalogue.editModal.sections.limits')}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Message Limit */}
            <div>
              <label htmlFor="messageLimit" className="block text-sm font-medium text-neutral-700">
                {t('catalogue.editModal.fields.messageLimit')} <span className="text-danger-600">*</span>
              </label>
              <input
                type="number"
                id="messageLimit"
                value={formData.messageLimit}
                onChange={(e) => handleChange('messageLimit', parseInt(e.target.value) || 0)}
                min="0"
                className={`mt-1 block w-full rounded-lg border ${
                  errors.messageLimit ? 'border-danger-300' : 'border-neutral-300'
                } px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                disabled={updateMutation.isPending}
              />
              {errors.messageLimit && (
                <p className="mt-1 text-xs text-danger-600">{errors.messageLimit}</p>
              )}
            </div>

            {/* Agent Limit */}
            <div>
              <label htmlFor="agentLimit" className="block text-sm font-medium text-neutral-700">
                {t('catalogue.editModal.fields.agentLimit')} <span className="text-danger-600">*</span>
              </label>
              <input
                type="number"
                id="agentLimit"
                value={formData.agentLimit}
                onChange={(e) => handleChange('agentLimit', parseInt(e.target.value) || 0)}
                min="0"
                className={`mt-1 block w-full rounded-lg border ${
                  errors.agentLimit ? 'border-danger-300' : 'border-neutral-300'
                } px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                disabled={updateMutation.isPending}
              />
              {errors.agentLimit && (
                <p className="mt-1 text-xs text-danger-600">{errors.agentLimit}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing */}
        {isLoadingDetails ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              Pricing
            </h3>
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          </div>
        ) : formData.pricing && Object.keys(formData.pricing).length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              Pricing
            </h3>
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-700">
                      Currency
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-700">
                      Monthly
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-700">
                      Annual
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {Object.entries(formData.pricing).map(([currency, intervals]) => (
                    <tr key={currency}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900">
                        {currency}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          id={`price-${currency}-monthly`}
                          value={intervals?.monthly ?? 0}
                          onChange={(e) => handlePricingChange(currency as Currency, 'monthly' as BillingInterval, parseInt(e.target.value) || 0)}
                          min="0"
                          step="1"
                          className={`block w-full rounded border ${
                            errors[`pricing_${currency}_monthly`] ? 'border-danger-300' : 'border-neutral-300'
                          } px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                          disabled={updateMutation.isPending}
                        />
                        {errors[`pricing_${currency}_monthly`] && (
                          <p className="mt-0.5 text-xs text-danger-600">{errors[`pricing_${currency}_monthly`]}</p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          id={`price-${currency}-annual`}
                          value={intervals?.annual ?? 0}
                          onChange={(e) => handlePricingChange(currency as Currency, 'annual' as BillingInterval, parseInt(e.target.value) || 0)}
                          min="0"
                          step="1"
                          className={`block w-full rounded border ${
                            errors[`pricing_${currency}_annual`] ? 'border-danger-300' : 'border-neutral-300'
                          } px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                          disabled={updateMutation.isPending}
                        />
                        {errors[`pricing_${currency}_annual`] && (
                          <p className="mt-0.5 text-xs text-danger-600">{errors[`pricing_${currency}_annual`]}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Stripe Product Linking */}
        {isLoadingDetails ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              Stripe Product
            </h3>
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          </div>
        ) : planDetails?.stripeProductId ? (
          <div className="space-y-3">
            {/* Collapsible Header */}
            <button
              type="button"
              onClick={() => setIsStripeProductExpanded(!isStripeProductExpanded)}
              className="flex items-center gap-2 text-sm font-semibold text-neutral-900 hover:text-neutral-700 transition-colors"
            >
              {isStripeProductExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Stripe Product Linking
            </button>

            {/* Collapsible Content */}
            {isStripeProductExpanded && (
              <div className="space-y-4 rounded-lg border border-neutral-200 p-4 bg-neutral-50">
                {/* Product ID (read-only) */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Product ID
                  </label>
                  <code className="block w-full rounded bg-white px-3 py-2 text-sm text-neutral-900 border border-neutral-200">
                    {planDetails.stripeProductId}
                  </code>
                </div>

                {/* Product Name (editable) */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={stripeProductData.name}
                    onChange={(e) => setStripeProductData({ ...stripeProductData, name: e.target.value })}
                    className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Mojeeb Starter"
                  />
                </div>

                {/* Product Description (editable) */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Product Description
                  </label>
                  <textarea
                    value={stripeProductData.description}
                    onChange={(e) => setStripeProductData({ ...stripeProductData, description: e.target.value })}
                    rows={3}
                    className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
                    placeholder="1 agent, 3000 messages/month"
                  />
                </div>

                {/* Metadata (read-only) */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-neutral-200">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Created
                    </label>
                    <p className="text-xs text-neutral-700">
                      {planDetails.stripeCreatedAt
                        ? new Date(planDetails.stripeCreatedAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Updated
                    </label>
                    <p className="text-xs text-neutral-700">
                      {planDetails.stripeUpdatedAt
                        ? new Date(planDetails.stripeUpdatedAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Mode
                    </label>
                    <p className="text-xs text-neutral-700">
                      {planDetails.stripeLivemode ? 'Production' : 'Test'}
                    </p>
                  </div>
                </div>

                {/* Sync Checkbox */}
                <div className="pt-2 border-t border-neutral-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncToStripe}
                      onChange={(e) => setSyncToStripe(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
                    />
                    <span className="text-sm text-neutral-700">
                      Also update Stripe product when saving
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-neutral-500 ml-6">
                    When checked, the product name and description will be synced to Stripe
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Stripe Price IDs */}
        {isLoadingDetails ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              Stripe Price IDs
            </h3>
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          </div>
        ) : planDetails?.stripePriceIds && Object.keys(planDetails.stripePriceIds).length > 0 ? (
          <div className="space-y-3">
            {/* Collapsible Header */}
            <button
              type="button"
              onClick={() => setIsStripeExpanded(!isStripeExpanded)}
              className="flex items-center gap-2 text-sm font-semibold text-neutral-900 hover:text-neutral-700 transition-colors"
            >
              {isStripeExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Stripe Price IDs
            </button>

            {/* Collapsible Content */}
            {isStripeExpanded && (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-700">
                        Currency
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-700">
                        Monthly Price ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-700">
                        Annual Price ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {Object.entries(planDetails.stripePriceIds).map(([currency, intervals]) => (
                      <tr key={currency}>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900">
                          {currency}
                        </td>
                        <td className="px-4 py-2">
                          {intervals?.monthly ? (
                            <code
                              onClick={() => handleCopyPriceId(intervals.monthly)}
                              className="cursor-pointer rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-200 transition-colors"
                              title="Click to copy"
                            >
                              {intervals.monthly}
                            </code>
                          ) : (
                            <span className="text-xs text-neutral-400">Not set</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {intervals?.annual ? (
                            <code
                              onClick={() => handleCopyPriceId(intervals.annual)}
                              className="cursor-pointer rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-200 transition-colors"
                              title="Click to copy"
                            >
                              {intervals.annual}
                            </code>
                          ) : (
                            <span className="text-xs text-neutral-400">Not set</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            disabled={updateMutation.isPending}
          >
            {t('catalogue.editModal.cancel')}
          </button>
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? t('catalogue.editModal.updating') : t('catalogue.editModal.update')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
