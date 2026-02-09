/**
 * Addon Marketplace Modal
 * Customer-facing modal to purchase addons with Stripe integration
 * Shows available addons with pricing, allows currency/quantity selection
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare, Users, ShoppingCart, CreditCard } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { useAvailableAddons, useCreateAddonCheckout } from '../hooks/useAddonPurchase';
import type { AddonPlan, AddonType } from '../types/addon.types';

interface AddonMarketplaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
    { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
] as const;

const BILLING_INTERVALS = [
    { value: 'monthly' as const, label: 'Monthly' },
    { value: 'annual' as const, label: 'Annual' },
] as const;

export function AddonMarketplaceModal({ isOpen, onClose }: AddonMarketplaceModalProps) {
    const { data: addons, isLoading: loadingAddons } = useAvailableAddons();
    const checkoutMutation = useCreateAddonCheckout();
    const subscription = useSubscriptionStore((state) => state.subscription);
    const usage = useSubscriptionStore((state) => state.usage);

    const [selectedAddon, setSelectedAddon] = useState<AddonPlan | null>(null);
    const [currency, setCurrency] = useState<string>('USD');
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
    const [quantity, setQuantity] = useState(1);

    // Group addons by type
    const messageAddons = useMemo(
        () => addons?.filter((a) => a.addon_type === 'message_credits') || [],
        [addons]
    );
    const agentAddons = useMemo(
        () => addons?.filter((a) => a.addon_type === 'agent_slots') || [],
        [addons]
    );

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedAddon(null);
            setCurrency('USD');
            setBillingInterval('monthly');
            setQuantity(1);
        }
    }, [isOpen]);

    // Get price for selected addon
    const price = useMemo(() => {
        if (!selectedAddon?.pricing) return null;
        const currencyPricing = selectedAddon.pricing[currency];
        if (!currencyPricing) return null;
        return currencyPricing[billingInterval];
    }, [selectedAddon, currency, billingInterval]);

    // Calculate total price
    const totalPrice = price ? price * quantity : 0;

    // Get currency symbol
    const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '$';

    // Handle addon selection
    const handleAddonSelect = useCallback((addon: AddonPlan) => {
        setSelectedAddon(addon);
        setQuantity(1);
    }, []);

    // Handle checkout
    const handleCheckout = useCallback(async () => {
        if (!selectedAddon) return;

        await checkoutMutation.mutateAsync({
            addon_code: selectedAddon.code,
            quantity,
            currency,
            billing_interval: billingInterval,
        });
        // Note: mutation will redirect to Stripe on success, so no need to close modal
    }, [selectedAddon, quantity, currency, billingInterval, checkoutMutation]);

    // Render addon card
    const renderAddonCard = (addon: AddonPlan) => {
        const isSelected = selectedAddon?.id === addon.id;
        const addonPrice = addon.pricing?.[currency]?.[billingInterval];
        const icon = addon.addon_type === 'message_credits' ? MessageSquare : Users;
        const Icon = icon;

        return (
            <button
                key={addon.id}
                type="button"
                onClick={() => handleAddonSelect(addon)}
                className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                    isSelected
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                }`}
            >
                {/* Icon */}
                <div className={`mb-3 inline-flex rounded-lg p-2.5 ${
                    addon.addon_type === 'message_credits'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-purple-100 text-purple-600'
                }`}>
                    <Icon className="h-5 w-5" />
                </div>

                {/* Name & Description */}
                <h3 className="font-semibold text-neutral-900 mb-1">{addon.name}</h3>
                {addon.description && (
                    <p className="text-xs text-neutral-600 mb-3">{addon.description}</p>
                )}

                {/* Quantity */}
                <p className="text-sm font-medium text-neutral-700 mb-2">
                    +{addon.quantity.toLocaleString()}{' '}
                    {addon.addon_type === 'message_credits' ? 'messages' : 'agents'}
                </p>

                {/* Price */}
                {addonPrice ? (
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-neutral-900">
                            {currencySymbol}{addonPrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-neutral-500">
                            /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                        </span>
                    </div>
                ) : (
                    <p className="text-sm text-neutral-500">Not available in {currency}</p>
                )}

                {/* Selected indicator */}
                {isSelected && (
                    <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                    </div>
                )}
            </button>
        );
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Purchase Add-ons"
            subtitle="Boost your subscription with extra capacity"
            maxWidth="2xl"
            isLoading={checkoutMutation.isPending}
            closable={!checkoutMutation.isPending}
        >
            <div className="space-y-6">
                {/* Current Usage */}
                {usage && (
                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                        <h3 className="text-sm font-medium text-neutral-900 mb-3">Current Usage</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Messages */}
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-100 p-2">
                                    <MessageSquare className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-600">Messages</p>
                                    <p className="text-sm font-semibold text-neutral-900">
                                        {usage.messagesUsed.toLocaleString()} / {usage.messagesLimit.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {/* Agents */}
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-purple-100 p-2">
                                    <Users className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-600">Agents</p>
                                    <p className="text-sm font-semibold text-neutral-900">
                                        {usage.agentsUsed} / {usage.agentsLimit}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Currency & Billing Interval */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Currency Selector */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Currency</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            disabled={checkoutMutation.isPending}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            {CURRENCIES.map((curr) => (
                                <option key={curr.code} value={curr.code}>
                                    {curr.symbol} {curr.name} ({curr.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Billing Interval Selector */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Billing Period
                        </label>
                        <select
                            value={billingInterval}
                            onChange={(e) => setBillingInterval(e.target.value as 'monthly' | 'annual')}
                            disabled={checkoutMutation.isPending}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            {BILLING_INTERVALS.map((interval) => (
                                <option key={interval.value} value={interval.value}>
                                    {interval.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Message Credits */}
                {messageAddons.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            Message Credits
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {messageAddons.map(renderAddonCard)}
                        </div>
                    </div>
                )}

                {/* Agent Slots */}
                {agentAddons.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            Agent Slots
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {agentAddons.map(renderAddonCard)}
                        </div>
                    </div>
                )}

                {/* Quantity Selector (shown when addon selected) */}
                {selectedAddon && price && (
                    <div className="rounded-lg bg-primary-50 border border-primary-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h4 className="text-sm font-semibold text-neutral-900">
                                    {selectedAddon.name}
                                </h4>
                                <p className="text-xs text-neutral-600">
                                    {selectedAddon.quantity.toLocaleString()} {' '}
                                    {selectedAddon.addon_type === 'message_credits' ? 'messages' : 'agents'} per unit
                                </p>
                            </div>
                        </div>

                        {/* Quantity Picker */}
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-neutral-700">Quantity:</label>
                            <div className="flex items-center border border-neutral-300 rounded-lg bg-white">
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    disabled={quantity <= 1 || checkoutMutation.isPending}
                                    className="px-3 py-2 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        setQuantity(Math.max(1, Math.min(100, val)));
                                    }}
                                    disabled={checkoutMutation.isPending}
                                    min={1}
                                    max={100}
                                    className="w-20 text-center border-x border-neutral-300 py-2 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                                    disabled={quantity >= 100 || checkoutMutation.isPending}
                                    className="px-3 py-2 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    +
                                </button>
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-sm font-medium text-neutral-900">
                                    Total: {(selectedAddon.quantity * quantity).toLocaleString()}{' '}
                                    {selectedAddon.addon_type === 'message_credits' ? 'messages' : 'agents'}
                                </p>
                            </div>
                        </div>

                        {/* Total Price */}
                        <div className="mt-4 pt-4 border-t border-primary-200 flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-700">Total Price:</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-neutral-900">
                                    {currencySymbol}{totalPrice.toFixed(2)}
                                </span>
                                <span className="text-sm text-neutral-600">
                                    /{billingInterval === 'monthly' ? 'month' : 'year'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* No addons available */}
                {!loadingAddons && (!addons || addons.length === 0) && (
                    <div className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
                        <p className="text-neutral-600">No add-ons available for purchase</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={checkoutMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleCheckout}
                        disabled={!selectedAddon || !price || checkoutMutation.isPending}
                        isLoading={checkoutMutation.isPending}
                        className="bg-primary-600 text-white hover:bg-primary-700"
                    >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay with Stripe
                    </Button>
                </div>
            </div>
        </BaseModal>
    );
}
