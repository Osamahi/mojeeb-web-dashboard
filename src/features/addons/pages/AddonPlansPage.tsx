import { useState, useEffect } from 'react';
import { useAddonPlans } from '../hooks/useAddonPlans';
import { Package, MessageSquare, Users, Check, X } from 'lucide-react';
import type { AddonType } from '../types/addon.types';

export function AddonPlansPage() {
    const [addonTypeFilter, setAddonTypeFilter] = useState<AddonType | ''>('');

    const { data: plans, isLoading, error } = useAddonPlans(addonTypeFilter || undefined);

    // DEBUG: Log component mount and query state changes
    useEffect(() => {
        console.log('[AddonPlansPage] Component mounted/updated', {
            addonTypeFilter,
            isLoading,
            hasError: !!error,
            errorMessage: error?.message,
            plansCount: plans?.length ?? 0,
            plans: plans,
        });
    }, [addonTypeFilter, isLoading, error, plans]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">Add-on Plans</h1>
                <p className="text-neutral-600 mt-2">
                    Available add-on packages to extend organization capacity
                </p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between mb-6">
                <select
                    value={addonTypeFilter}
                    onChange={(e) => setAddonTypeFilter(e.target.value as AddonType | '')}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                    <option value="">All Types</option>
                    <option value="message_credits">Message Credits</option>
                    <option value="agent_slots">Agent Slots</option>
                </select>

                <div className="text-sm text-neutral-600">
                    {plans && `${plans.length} plan${plans.length !== 1 ? 's' : ''}`}
                </div>
            </div>

            {/* Plans Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6 animate-pulse">
                            <div className="h-12 w-12 bg-neutral-200 rounded-lg mb-4"></div>
                            <div className="h-6 bg-neutral-200 rounded mb-2"></div>
                            <div className="h-4 bg-neutral-200 rounded mb-4"></div>
                            <div className="h-10 bg-neutral-200 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                    <p className="text-red-600 font-medium">Failed to load add-on plans</p>
                    <p className="text-sm text-red-500 mt-1">{error.message}</p>
                </div>
            ) : !plans || plans.length === 0 ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-12 text-center">
                    <Package className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600 font-medium">No add-on plans found</p>
                    <p className="text-sm text-neutral-500 mt-1">
                        {addonTypeFilter ? 'Try changing the filter' : 'No plans available'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const isMessageCredits = plan.addon_type === 'message_credits';
                        const Icon = isMessageCredits ? MessageSquare : Users;

                        return (
                            <div
                                key={plan.id}
                                className="bg-white rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow p-6"
                            >
                                {/* Icon and Status */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${isMessageCredits ? 'bg-blue-100' : 'bg-purple-100'}`}>
                                        <Icon className={`w-6 h-6 ${isMessageCredits ? 'text-blue-600' : 'text-purple-600'}`} />
                                    </div>

                                    {plan.is_active ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <Check className="w-3 h-3" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                                            <X className="w-3 h-3" />
                                            Inactive
                                        </span>
                                    )}
                                </div>

                                {/* Plan Name */}
                                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                                    {plan.name}
                                </h3>

                                {/* Description */}
                                {plan.description && (
                                    <p className="text-sm text-neutral-600 mb-4">
                                        {plan.description}
                                    </p>
                                )}

                                {/* Type Badge */}
                                <div className="mb-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                        isMessageCredits
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'bg-purple-50 text-purple-700'
                                    }`}>
                                        {plan.addon_type === 'message_credits' ? 'Message Credits' : 'Agent Slots'}
                                    </span>
                                </div>

                                {/* Quantity */}
                                <div className="pt-4 border-t border-neutral-200">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-neutral-900">
                                            +{plan.quantity.toLocaleString()}
                                        </span>
                                        <span className="text-sm text-neutral-600">
                                            {isMessageCredits ? 'messages' : 'agents'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Code: <code className="bg-neutral-100 px-1 py-0.5 rounded">{plan.code}</code>
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
