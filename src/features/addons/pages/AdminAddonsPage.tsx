import { useState } from 'react';
import { useAddonOperations } from '../hooks/useAddonOperations';
import { GrantAddonModal } from '../components/GrantAddonModal';
import { formatDistanceToNow } from 'date-fns';
import type { AddonType } from '../types/addon.types';

export function AdminAddonsPage() {
    const [showGrantModal, setShowGrantModal] = useState(false);
    const [addonTypeFilter, setAddonTypeFilter] = useState<AddonType | ''>('');
    const [page, setPage] = useState(1);
    const pageSize = 50;

    const { data: operations, isLoading, error } = useAddonOperations({
        page,
        page_size: pageSize,
        addon_type: addonTypeFilter || undefined,
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">Add-ons Management</h1>
                <p className="text-neutral-600 mt-2">
                    Grant additional capacity to organizations and view operation history
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {/* Type Filter */}
                    <select
                        value={addonTypeFilter}
                        onChange={(e) => {
                            setAddonTypeFilter(e.target.value as AddonType | '');
                            setPage(1); // Reset to first page when filtering
                        }}
                        className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">All Types</option>
                        <option value="message_credits">Message Credits</option>
                        <option value="agent_slots">Agent Slots</option>
                    </select>
                </div>

                {/* Grant Add-on Button */}
                <button
                    onClick={() => setShowGrantModal(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                    Grant Add-on
                </button>
            </div>

            {/* Operations Table */}
            <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="text-red-600">Failed to load add-on operations</p>
                    </div>
                ) : !operations || operations.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-neutral-600">No add-on operations found</p>
                        <p className="text-sm text-neutral-500 mt-1">
                            Grant your first add-on to get started
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-50 border-b border-neutral-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                                            Organization
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                                            Add-on
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                                            Granted By
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                                            Granted At
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                                            Notes
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-neutral-200">
                                    {operations.map((operation) => (
                                        <tr key={operation.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-neutral-900">
                                                    {operation.organization_name}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900">
                                                        {operation.addon_name}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 capitalize">
                                                        {operation.addon_type.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    +{operation.quantity_granted.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-neutral-900">
                                                    {operation.granted_by_user_email}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-neutral-600">
                                                    {formatDistanceToNow(new Date(operation.granted_at), {
                                                        addSuffix: true,
                                                    })}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {operation.notes ? (
                                                    <p
                                                        className="text-sm text-neutral-600 max-w-xs truncate"
                                                        title={operation.notes}
                                                    >
                                                        {operation.notes}
                                                    </p>
                                                ) : (
                                                    <span className="text-sm text-neutral-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
                            <p className="text-sm text-neutral-600">
                                Page {page} • {operations.length} operations
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 border border-neutral-300 rounded text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!operations || operations.length < pageSize}
                                    className="px-3 py-1 border border-neutral-300 rounded text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Grant Add-on Modal */}
            <GrantAddonModal
                isOpen={showGrantModal}
                onClose={() => setShowGrantModal(false)}
            />
        </div>
    );
}
