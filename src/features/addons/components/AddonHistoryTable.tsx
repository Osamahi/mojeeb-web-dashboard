import { useOrganizationAddonHistory } from '../hooks/useAddonOperations';
import { formatDistanceToNow } from 'date-fns';
import type { AddonOperation } from '../types/addon.types';

interface AddonHistoryTableProps {
    organizationId: string;
    limit?: number; // Optional limit for displaying recent operations
}

export function AddonHistoryTable({ organizationId, limit }: AddonHistoryTableProps) {
    const { data: operations, isLoading, error } = useOrganizationAddonHistory(organizationId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">Failed to load add-on history</p>
            </div>
        );
    }

    if (!operations || operations.length === 0) {
        return (
            <div className="p-8 text-center bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-neutral-600">No add-ons have been granted yet</p>
            </div>
        );
    }

    const displayedOperations = limit ? operations.slice(0, limit) : operations;

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
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
                    {displayedOperations.map((operation) => (
                        <AddonOperationRow key={operation.id} operation={operation} />
                    ))}
                </tbody>
            </table>

            {limit && operations.length > limit && (
                <div className="mt-3 text-center">
                    <p className="text-sm text-neutral-600">
                        Showing {limit} of {operations.length} operations
                    </p>
                </div>
            )}
        </div>
    );
}

function AddonOperationRow({ operation }: { operation: AddonOperation }) {
    return (
        <tr className="hover:bg-neutral-50 transition-colors">
            <td className="px-4 py-3">
                <div>
                    <p className="text-sm font-medium text-neutral-900">{operation.addon_name}</p>
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
                <p className="text-sm text-neutral-900">{operation.granted_by_user_email}</p>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm text-neutral-600">
                    {formatDistanceToNow(new Date(operation.granted_at), { addSuffix: true })}
                </p>
            </td>
            <td className="px-4 py-3">
                {operation.notes ? (
                    <p className="text-sm text-neutral-600 max-w-xs truncate" title={operation.notes}>
                        {operation.notes}
                    </p>
                ) : (
                    <span className="text-sm text-neutral-400">—</span>
                )}
            </td>
        </tr>
    );
}
