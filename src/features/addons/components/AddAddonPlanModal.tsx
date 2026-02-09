import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useCreateAddonPlan } from '../hooks/useCreateAddonPlan';
import type { AddonType } from '../types/addon.types';
import { DollarSign } from 'lucide-react';

interface AddAddonPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CURRENCIES = ['USD', 'EGP', 'SAR'] as const;

export function AddAddonPlanModal({ isOpen, onClose }: AddAddonPlanModalProps) {
    const createMutation = useCreateAddonPlan();

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        addon_type: 'message_credits' as AddonType,
        quantity: 1000,
        description: '',
        is_active: true,
        display_order: 0,
    });

    // Stripe mode state: 'none' = no Stripe product, 'test' = test mode, 'production' = production mode
    const [stripeLivemode, setStripeLivemode] = useState<'none' | 'test' | 'production'>('none');

    // Pricing state (one-time payment per currency): { USD: '49.99', EGP: '500', SAR: '180' }
    const [pricing, setPricing] = useState<Record<string, string>>({
        USD: '',
        EGP: '',
        SAR: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPricingSection, setShowPricingSection] = useState(true);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                code: '',
                name: '',
                addon_type: 'message_credits',
                quantity: 1000,
                description: '',
                is_active: true,
                display_order: 0,
            });
            setStripeLivemode('none');
            setPricing({
                USD: '',
                EGP: '',
                SAR: '',
            });
            setErrors({});
            setShowPricingSection(true);
        }
    }, [isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.code.trim()) {
            newErrors.code = 'Code is required';
        } else if (!/^[a-z0-9_]+$/.test(formData.code)) {
            newErrors.code = 'Code must contain only lowercase letters, numbers, and underscores';
        }

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

        if (!validateForm()) {
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

        // Validate pricing if Stripe product requested
        if (stripeLivemode !== 'none' && Object.keys(pricingData).length === 0) {
            setErrors({ pricing: 'At least one currency price is required when creating a Stripe product' });
            return;
        }

        // Convert stripeLivemode to boolean or null
        let stripeLivemodeValue: boolean | null = null;
        if (stripeLivemode === 'test') stripeLivemodeValue = false;
        if (stripeLivemode === 'production') stripeLivemodeValue = true;

        const payload = {
            ...formData,
            stripe_livemode: stripeLivemodeValue,
            pricing: stripeLivemode !== 'none' ? pricingData : (Object.keys(pricingData).length > 0 ? pricingData : undefined),
        };

        // Debug logging
        console.log('[AddAddonPlanModal] Submitting payload:', {
            stripeLivemode,
            stripeLivemodeValue,
            pricingData,
            payload
        });

        createMutation.mutate(payload, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    const handlePricingChange = (currency: string, value: string) => {
        setPricing((prev) => ({
            ...prev,
            [currency]: value,
        }));
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Add-on Plan"
            subtitle="Define a new add-on package for organizations"
            maxWidth="2xl"
            isLoading={createMutation.isPending}
            closable={!createMutation.isPending}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-neutral-900">Basic Information</h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Code */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-neutral-700 mb-1">
                                Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm ${
                                    errors.code ? 'border-red-500' : 'border-neutral-300'
                                }`}
                                placeholder="extra_messages_1000"
                                disabled={createMutation.isPending}
                            />
                            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
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
                                disabled={createMutation.isPending}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {/* Type */}
                        <div>
                            <label htmlFor="addon_type" className="block text-sm font-medium text-neutral-700 mb-1">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="addon_type"
                                value={formData.addon_type}
                                onChange={(e) => setFormData({ ...formData, addon_type: e.target.value as AddonType })}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                disabled={createMutation.isPending}
                            >
                                <option value="message_credits">Message Credits</option>
                                <option value="agent_slots">Agent Slots</option>
                            </select>
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
                                disabled={createMutation.isPending}
                            />
                            {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
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
                                disabled={createMutation.isPending}
                            />
                            <p className="mt-1 text-xs text-neutral-500">Lower = higher priority</p>
                        </div>
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
                            rows={2}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Optional description..."
                            disabled={createMutation.isPending}
                        />
                    </div>

                    {/* Is Active */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                            disabled={createMutation.isPending}
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-neutral-700">
                            Active (available for granting)
                        </label>
                    </div>
                </div>

                {/* Stripe Product Creation Section */}
                <div className="border-t border-neutral-200 pt-6">
                    <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                        Stripe Product
                    </h3>

                    <div>
                        <label htmlFor="stripe_livemode" className="block text-sm font-medium text-neutral-700 mb-1">
                            Product Creation
                        </label>
                        <select
                            id="stripe_livemode"
                            value={stripeLivemode}
                            onChange={(e) => setStripeLivemode(e.target.value as 'none' | 'test' | 'production')}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            disabled={createMutation.isPending}
                        >
                            <option value="none">No Stripe Product</option>
                            <option value="test">Create in Test Mode</option>
                            <option value="production">Create in Production Mode</option>
                        </select>
                        <p className="mt-1 text-xs text-neutral-500">
                            {stripeLivemode === 'none' && (
                                <>⚠️ Addon will be admin-only (cannot be purchased by customers)</>
                            )}
                            {stripeLivemode === 'test' && (
                                <>🧪 Creates product in Stripe Test Mode (test API keys, no real payments)</>
                            )}
                            {stripeLivemode === 'production' && (
                                <>💳 Creates product in Stripe Production Mode (live payments enabled)</>
                            )}
                        </p>
                    </div>
                </div>

                {/* Pricing Section (Only shown if Stripe product is being created) */}
                {stripeLivemode !== 'none' && (
                    <div className="border-t border-neutral-200 pt-6">
                        <button
                            type="button"
                            onClick={() => setShowPricingSection(!showPricingSection)}
                            className="flex items-center justify-between w-full mb-4"
                        >
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-neutral-600" />
                                <h3 className="text-sm font-semibold text-neutral-900">Pricing & Stripe Integration</h3>
                                <span className="text-xs text-red-500">*</span>
                                <span className="text-xs text-neutral-500">(Required for Stripe product)</span>
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
                                                    disabled={createMutation.isPending}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-2">
                                        Backend will automatically create Stripe product and prices
                                    </p>
                                    {errors.pricing && <p className="mt-2 text-sm text-red-600">{errors.pricing}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={createMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={createMutation.isPending}
                        disabled={createMutation.isPending}
                    >
                        Create Plan
                    </Button>
                </div>
            </form>
        </BaseModal>
    );
}
