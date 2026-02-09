import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useUpdateAddonPlan } from '../hooks/useUpdateAddonPlan';
import type { AddonPlan } from '../types/addon.types';
import { DollarSign, ExternalLink, RefreshCw } from 'lucide-react';

interface EditAddonPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: AddonPlan | null;
}

const CURRENCIES = ['USD', 'EGP', 'SAR'] as const;

export function EditAddonPlanModal({ isOpen, onClose, plan }: EditAddonPlanModalProps) {
    const updateMutation = useUpdateAddonPlan();

    const [formData, setFormData] = useState({
        name: '',
        quantity: 1000,
        description: '',
        is_active: true,
        display_order: 0,
    });

    // Pricing state (one-time payment per currency): { USD: '49.99', EGP: '500', SAR: '180' }
    const [pricing, setPricing] = useState<Record<string, string>>({
        USD: '',
        EGP: '',
        SAR: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPricingSection, setShowPricingSection] = useState(false);
    const [syncToStripe, setSyncToStripe] = useState(false);

    // Initialize form with plan data when plan changes
    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name,
                quantity: plan.quantity,
                description: plan.description || '',
                is_active: plan.is_active,
                display_order: plan.display_order || 0,
            });
            setSyncToStripe(false);

            // Initialize pricing from plan (one-time payment per currency)
            const newPricing: Record<string, string> = {
                USD: '',
                EGP: '',
                SAR: '',
            };

            if (plan.pricing) {
                CURRENCIES.forEach((currency) => {
                    const price = plan.pricing?.[currency];
                    if (price !== undefined && price !== null) {
                        newPricing[currency] = price.toString();
                    }
                });
            }
            setPricing(newPricing);

            // Expand pricing section if plan has pricing data
            setShowPricingSection(!!plan.pricing);
            setErrors({});
        }
    }, [plan]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (formData.quantity < 1) {
            newErrors.quantity = 'Quantity must be at least 1';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!plan || !validateForm()) {
            return;
        }

        // Convert pricing to proper format (filter out empty values)
        const pricingData: Record<string, number> = {};
        CURRENCIES.forEach((currency) => {
            const value = pricing[currency];
            if (value && value.trim() !== '') {
                pricingData[currency] = parseFloat(value);
            }
        });

        const payload = {
            ...formData,
            pricing: Object.keys(pricingData).length > 0 ? pricingData : undefined,
            sync_to_stripe: syncToStripe,
        };

        updateMutation.mutate(
            { id: plan.id, plan: payload },
            {
                onSuccess: () => {
                    onClose();
                },
            }
        );
    };

    const handlePricingChange = (currency: string, value: string) => {
        setPricing((prev) => ({
            ...prev,
            [currency]: value,
        }));
    };

    if (!plan) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Add-on Plan"
            subtitle={`Updating plan: ${plan.code}`}
            maxWidth="2xl"
            isLoading={updateMutation.isPending}
            closable={!updateMutation.isPending}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Read-only Code */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Code
                    </label>
                    <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 font-mono text-sm text-neutral-600">
                        {plan.code}
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">Code cannot be changed</p>
                </div>

                {/* Read-only Type */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Type
                    </label>
                    <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-sm text-neutral-600">
                        {plan.addon_type === 'message_credits' ? 'Message Credits' : 'Agent Slots'}
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">Type cannot be changed</p>
                </div>

                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                        Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            errors.name ? 'border-red-500' : 'border-neutral-300'
                        }`}
                        placeholder="1000 Extra Messages"
                        disabled={updateMutation.isPending}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Quantity */}
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-neutral-700 mb-1">
                        Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        id="quantity"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                        min="1"
                        step="1"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            errors.quantity ? 'border-red-500' : 'border-neutral-300'
                        }`}
                        disabled={updateMutation.isPending}
                    />
                    {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                    <p className="mt-1 text-xs text-neutral-500">
                        Number of {plan.addon_type === 'message_credits' ? 'messages' : 'agent slots'} to grant
                    </p>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Optional description..."
                        disabled={updateMutation.isPending}
                    />
                </div>

                {/* Display Order */}
                <div>
                    <label htmlFor="display_order" className="block text-sm font-medium text-neutral-700 mb-1">
                        Display Order
                    </label>
                    <input
                        type="number"
                        id="display_order"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        disabled={updateMutation.isPending}
                    />
                    <p className="mt-1 text-xs text-neutral-500">Lower = higher priority in marketplace</p>
                </div>

                {/* Is Active */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                        disabled={updateMutation.isPending}
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-neutral-700">
                        Active (available for granting)
                    </label>
                </div>

                {/* Stripe Sync Section (Only shown if plan has Stripe product) */}
                {plan.stripe_product_id && (
                    <div className="border-t border-neutral-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <RefreshCw className="h-5 w-5 text-blue-600" />
                            <h3 className="text-sm font-semibold text-neutral-900">Stripe Product Sync</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                plan.stripe_livemode
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {plan.stripe_livemode ? '💳 Production' : '🧪 Test'}
                            </span>
                        </div>

                        {/* Current Stripe Data */}
                        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3 mb-4">
                            {/* Product ID */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                    Stripe Product ID
                                </label>
                                <div className="flex items-center gap-2">
                                    <code className="text-sm font-mono text-neutral-900">{plan.stripe_product_id}</code>
                                    <a
                                        href={`https://dashboard.stripe.com${plan.stripe_livemode ? '' : '/test'}/products/${plan.stripe_product_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>

                            {/* Current Price IDs */}
                            {plan.stripe_price_ids && Object.keys(plan.stripe_price_ids).length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                                        Current Stripe Price IDs
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {CURRENCIES.map((currency) => {
                                            const priceId = plan.stripe_price_ids?.[currency];
                                            return priceId ? (
                                                <div key={currency} className="flex items-center gap-1">
                                                    <span className="text-xs text-neutral-500">{currency}:</span>
                                                    <code className="text-xs font-mono text-neutral-700">{priceId}</code>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Last Synced */}
                            {plan.stripe_updated_at && (
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                                        Last Synced
                                    </label>
                                    <span className="text-sm text-neutral-700">
                                        {new Date(plan.stripe_updated_at).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Sync Checkbox */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="sync_to_stripe"
                                    checked={syncToStripe}
                                    onChange={(e) => setSyncToStripe(e.target.checked)}
                                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
                                    disabled={updateMutation.isPending}
                                />
                                <div className="flex-1">
                                    <label htmlFor="sync_to_stripe" className="block text-sm font-medium text-neutral-900 cursor-pointer">
                                        Sync pricing changes to Stripe
                                    </label>
                                    <p className="text-xs text-neutral-600 mt-1">
                                        ⚠️ When enabled, changed prices will archive old Stripe prices and create new ones. This operation cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pricing Section (Collapsible) */}
                <div className="border-t border-neutral-200 pt-6">
                    <button
                        type="button"
                        onClick={() => setShowPricingSection(!showPricingSection)}
                        className="flex items-center justify-between w-full mb-4"
                    >
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-neutral-600" />
                            <h3 className="text-sm font-semibold text-neutral-900">Pricing & Stripe Integration</h3>
                            <span className="text-xs text-neutral-500">(Optional - for customer purchases)</span>
                        </div>
                        <span className="text-neutral-400">{showPricingSection ? '▼' : '▶'}</span>
                    </button>

                    {showPricingSection && (
                        <div className="space-y-6">
                            {/* Pricing (One-time payment per currency) */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-3">
                                    Pricing (one-time payment per currency)
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {CURRENCIES.map((currency) => (
                                        <div key={currency}>
                                            <label className="block text-xs text-neutral-600 mb-1">{currency}</label>
                                            <input
                                                type="number"
                                                value={pricing[currency] || ''}
                                                onChange={(e) => handlePricingChange(currency, e.target.value)}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                disabled={updateMutation.isPending}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-neutral-500 mt-2">
                                    {plan.stripe_product_id
                                        ? 'Update prices and check "Sync to Stripe" to create new Stripe prices'
                                        : 'One-time payment price for this addon package'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={updateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={updateMutation.isPending}
                        disabled={updateMutation.isPending}
                    >
                        Save Changes
                    </Button>
                </div>
            </form>
        </BaseModal>
    );
}
