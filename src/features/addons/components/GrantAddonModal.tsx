import { useState } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { useAddonPlans } from '../hooks/useAddonPlans';
import { useGrantAddonMutation } from '../hooks/useGrantAddonMutation';

interface GrantAddonModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId?: string; // Pre-filled if coming from subscription page
    organizationName?: string; // Display name
}

export function GrantAddonModal({
    isOpen,
    onClose,
    organizationId: initialOrgId,
    organizationName,
}: GrantAddonModalProps) {
    const { data: addonPlans, isLoading: loadingPlans } = useAddonPlans();
    const grantMutation = useGrantAddonMutation();

    const [selectedAddonCode, setSelectedAddonCode] = useState('');
    const [notes, setNotes] = useState('');

    const handleGrant = async () => {
        if (!initialOrgId || !selectedAddonCode) return;

        await grantMutation.mutateAsync({
            organization_id: initialOrgId,
            addon_code: selectedAddonCode,
            notes: notes.trim() || undefined,
        });

        // Reset form and close modal
        setSelectedAddonCode('');
        setNotes('');
        onClose();
    };

    const handleClose = () => {
        if (!grantMutation.isPending) {
            setSelectedAddonCode('');
            setNotes('');
            onClose();
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Grant Add-on"
            subtitle={
                organizationName
                    ? `Add extra capacity to ${organizationName}'s subscription`
                    : 'Add extra capacity to organization subscription'
            }
            maxWidth="md"
            closable={!grantMutation.isPending}
        >
            <div className="space-y-4">
                {/* Organization Info (if pre-filled) */}
                {organizationName && (
                    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <p className="text-sm text-neutral-600">Organization</p>
                        <p className="font-medium text-neutral-900">{organizationName}</p>
                    </div>
                )}

                {/* Add-on Plan Selector */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Add-on Plan <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedAddonCode}
                        onChange={(e) => setSelectedAddonCode(e.target.value)}
                        disabled={loadingPlans || grantMutation.isPending}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                    >
                        <option value="">Select add-on...</option>
                        {(addonPlans || []).map((plan) => (
                            <option key={plan.code} value={plan.code}>
                                {plan.name} ({plan.quantity.toLocaleString()}{' '}
                                {plan.addon_type === 'message_credits' ? 'messages' : 'agents'})
                            </option>
                        ))}
                    </select>
                    {loadingPlans && (
                        <p className="text-xs text-neutral-500 mt-1">Loading add-on plans...</p>
                    )}
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Notes <span className="text-neutral-400">(optional)</span>
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={grantMutation.isPending}
                        placeholder="e.g., Customer support goodwill, Promotional credit, etc."
                        rows={3}
                        maxLength={1000}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed resize-none"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                        {notes.length}/1000 characters
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
                    <button
                        onClick={handleClose}
                        disabled={grantMutation.isPending}
                        className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGrant}
                        disabled={!initialOrgId || !selectedAddonCode || grantMutation.isPending}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {grantMutation.isPending ? 'Granting...' : 'Grant Add-on'}
                    </button>
                </div>
            </div>
        </BaseModal>
    );
}
