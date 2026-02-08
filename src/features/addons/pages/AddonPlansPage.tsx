import { useState } from 'react';
import { useAddonPlans } from '../hooks/useAddonPlans';
import { Package, Check, X } from 'lucide-react';
import type { AddonType } from '../types/addon.types';

export function AddonPlansPage() {
    const [addonTypeFilter, setAddonTypeFilter] = useState<AddonType | ''>('');

    const { data: plans, isLoading, error } = useAddonPlans(addonTypeFilter || undefined);

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

            {/* Plans Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
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
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 bg-white">
                            {plans.map((plan) => {
                                const isMessageCredits = plan.addon_type === 'message_credits';

                                return (
                                    <tr key={plan.id} className="hover:bg-neutral-50">
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <code className="text-sm font-mono text-neutral-900 bg-neutral-100 px-2 py-1 rounded">
                                                {plan.code}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-neutral-900">
                                                {plan.name}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                isMessageCredits
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'bg-purple-50 text-purple-700'
                                            }`}>
                                                {plan.addon_type === 'message_credits' ? 'Message Credits' : 'Agent Slots'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-bold text-neutral-900">
                                                    +{plan.quantity.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-neutral-500">
                                                    {isMessageCredits ? 'messages' : 'agents'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {plan.description ? (
                                                <p className="text-sm text-neutral-600 max-w-xs">
                                                    {plan.description}
                                                </p>
                                            ) : (
                                                <span className="text-sm text-neutral-400">—</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
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
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
