/**
 * Grant Add-on Modal
 * Allows SuperAdmin to grant add-ons to any organization
 * Shows current usage/limits and calculates total capacity after granting
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Users, Search, Building2 } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { organizationService } from '@/features/organizations/services/organizationService';
import { subscriptionService } from '@/features/subscriptions/services/subscriptionService';
import { useAddonPlans } from '../hooks/useAddonPlans';
import { useGrantAddonMutation } from '../hooks/useGrantAddonMutation';

interface GrantAddonModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GrantAddonModal({ isOpen, onClose }: GrantAddonModalProps) {
    const { data: addonPlans, isLoading: loadingPlans } = useAddonPlans();
    const grantMutation = useGrantAddonMutation();

    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedAddonCode, setSelectedAddonCode] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [focusedIndex, setFocusedIndex] = useState(-1);

    // Fetch ALL organizations
    const { data: organizations, isLoading: loadingOrganizations } = useQuery({
        queryKey: ['organizations', 'all'],
        queryFn: () => organizationService.getOrganizations(),
        enabled: isOpen,
    });

    // Filter organizations by search query
    const filteredOrganizations = useMemo(() => {
        if (!organizations || organizations.length === 0) return [];
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();
        return organizations.filter(org =>
            org.name?.toLowerCase().includes(query) ||
            org.id?.toLowerCase().includes(query) ||
            org.contactEmail?.toLowerCase().includes(query)
        ).slice(0, 20);
    }, [organizations, searchQuery]);

    // Find selected organization
    const selectedOrganization = organizations?.find(org => org.id === selectedOrgId);

    // Fetch subscription for selected organization (filter by organizationId)
    // This avoids pagination issues and is more efficient than fetching all subscriptions
    const { data: subscriptions } = useQuery({
        queryKey: ['subscriptions', 'by-org', selectedOrgId],
        queryFn: () => subscriptionService.getAllSubscriptions(
            { organizationId: selectedOrgId },
            1,
            10
        ),
        enabled: isOpen && !!selectedOrgId,
    });

    // Since we're filtering by organizationId, the first result is the one we want
    const selectedSubscription = subscriptions?.[0];

    // Fetch usage for selected organization (only if they have a subscription)
    const { data: usage } = useQuery({
        queryKey: ['subscription-usage', selectedSubscription?.id],
        queryFn: () => subscriptionService.getSubscriptionUsage(selectedSubscription!.id),
        enabled: !!selectedSubscription?.id,
        staleTime: 0,
    });

    // Get selected plan for calculating total
    const selectedPlan = addonPlans?.find((plan) => plan.code === selectedAddonCode);
    const totalQuantity = selectedPlan ? selectedPlan.quantity * quantity : 0;

    // Calculate new limits after granting
    const newMessageLimit = usage && selectedPlan?.addon_type === 'message_credits'
        ? usage.messagesLimit + totalQuantity
        : usage?.messagesLimit;
    const newAgentLimit = usage && selectedPlan?.addon_type === 'agent_slots'
        ? usage.agentsLimit + totalQuantity
        : usage?.agentsLimit;

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedOrgId('');
            setSearchQuery('');
            setShowDropdown(false);
            setSelectedAddonCode('');
            setQuantity(1);
            setNotes('');
            setValidationError(null);
            setFocusedIndex(-1);
        }
    }, [isOpen]);

    const handleOrganizationSelect = useCallback((orgId: string) => {
        setSelectedOrgId(orgId);
        setSearchQuery('');
        setShowDropdown(false);
        setFocusedIndex(-1);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!showDropdown || filteredOrganizations.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex((i) => Math.min(i + 1, filteredOrganizations.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex((i) => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0) {
                    handleOrganizationSelect(filteredOrganizations[focusedIndex].id);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setShowDropdown(false);
                setFocusedIndex(-1);
                break;
        }
    }, [showDropdown, filteredOrganizations, focusedIndex, handleOrganizationSelect]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (!selectedOrgId) {
            setValidationError('Please select an organization');
            return;
        }

        if (!selectedSubscription) {
            setValidationError('Selected organization has no active subscription');
            return;
        }

        if (!selectedAddonCode) {
            setValidationError('Please select an add-on plan');
            return;
        }

        await grantMutation.mutateAsync({
            organization_id: selectedOrgId,
            addon_code: selectedAddonCode,
            quantity,
            notes: notes.trim() || undefined,
        });

        onClose();
    };

    const canSubmit = selectedOrgId && selectedSubscription && selectedAddonCode && !grantMutation.isPending;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Grant Add-on"
            subtitle="Add extra capacity to organization subscription"
            maxWidth="lg"
            isLoading={grantMutation.isPending}
            closable={!grantMutation.isPending}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Validation Error Display */}
                {validationError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{validationError}</p>
                    </div>
                )}

                {/* Organization Selector */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Organization <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
                            <input
                                type="text"
                                role="combobox"
                                aria-autocomplete="list"
                                aria-expanded={showDropdown && searchQuery.length > 0}
                                aria-controls="organization-listbox"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowDropdown(true);
                                    setFocusedIndex(-1);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search organizations..."
                                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        {/* Dropdown */}
                        {showDropdown && searchQuery.length > 0 && (
                            <div
                                id="organization-listbox"
                                role="listbox"
                                className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                            >
                                {searchQuery.length < 2 ? (
                                    <div className="p-4 text-center text-sm text-neutral-500">
                                        Type at least 2 characters to search...
                                    </div>
                                ) : loadingOrganizations ? (
                                    <div className="p-4 text-center text-sm text-neutral-500">
                                        Loading...
                                    </div>
                                ) : filteredOrganizations.length > 0 ? (
                                    <div className="py-2">
                                        {filteredOrganizations.map((org, index) => (
                                            <button
                                                key={org.id}
                                                type="button"
                                                role="option"
                                                aria-selected={selectedOrgId === org.id}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleOrganizationSelect(org.id);
                                                }}
                                                onMouseEnter={() => setFocusedIndex(index)}
                                                className={`w-full px-4 py-3 transition-colors flex items-start gap-3 text-left ${
                                                    focusedIndex === index ? 'bg-primary-50' : 'hover:bg-neutral-50'
                                                }`}
                                            >
                                                <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <Building2 className="h-4 w-4 text-neutral-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-neutral-900 truncate">
                                                        {org.name}
                                                    </div>
                                                    {org.contactEmail && (
                                                        <div className="text-xs text-neutral-500 truncate">
                                                            {org.contactEmail}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-neutral-500">
                                        No organizations found matching "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Selected Organization Display */}
                        {selectedOrganization && (
                            <div className="mt-2">
                                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                                            <Building2 className="h-5 w-5 text-neutral-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-neutral-900">
                                                {selectedOrganization.name}
                                            </div>
                                            {selectedOrganization.contactEmail && (
                                                <div className="text-sm text-neutral-600 mt-1">
                                                    {selectedOrganization.contactEmail}
                                                </div>
                                            )}
                                            {selectedSubscription && (
                                                <div className="text-xs text-neutral-500 mt-1">
                                                    {selectedSubscription.planName} • {selectedSubscription.status}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!selectedSubscription && (
                                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                            ⚠️ This organization has no active subscription. Add-ons cannot be granted without a subscription.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Usage Display (only if org selected and has subscription) */}
                {selectedOrgId && usage && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-neutral-900">Current Usage & Limits</h3>

                        {/* Messages Usage */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-50 p-2.5">
                                        <MessageSquare className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Messages</h4>
                                        <p className="text-xs text-gray-500">Current billing period</p>
                                    </div>
                                </div>
                                <div className="rounded-full px-3 py-1 text-xs font-medium bg-green-50 text-green-600">
                                    {usage.messageUsagePercentage.toFixed(1)}%
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                                <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-300 bg-green-500"
                                        style={{ width: `${Math.min(usage.messageUsagePercentage, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-semibold text-gray-900">{usage.messagesUsed.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Used</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold text-gray-900">{usage.messagesRemaining.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Remaining</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold text-gray-900">{usage.messagesLimit.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Limit</p>
                                </div>
                            </div>

                            {/* New Limit Preview */}
                            {newMessageLimit && newMessageLimit !== usage.messagesLimit && (
                                <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3">
                                    <p className="text-sm font-medium text-green-800">
                                        After granting: <span className="font-semibold">{newMessageLimit.toLocaleString()}</span> messages
                                        <span className="text-green-600 ml-1">(+{(newMessageLimit - usage.messagesLimit).toLocaleString()})</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Agents Usage */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-purple-50 p-2.5">
                                        <Users className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Agents</h4>
                                        <p className="text-xs text-gray-500">Active agents</p>
                                    </div>
                                </div>
                                <div className="rounded-full px-3 py-1 text-xs font-medium bg-green-50 text-green-600">
                                    {((usage.agentsUsed / usage.agentsLimit) * 100).toFixed(1)}%
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                                <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-300 bg-purple-500"
                                        style={{ width: `${Math.min((usage.agentsUsed / usage.agentsLimit) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-semibold text-gray-900">{usage.agentsUsed}</p>
                                    <p className="text-xs text-gray-500">Used</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold text-gray-900">{usage.agentsRemaining}</p>
                                    <p className="text-xs text-gray-500">Remaining</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold text-gray-900">{usage.agentsLimit}</p>
                                    <p className="text-xs text-gray-500">Limit</p>
                                </div>
                            </div>

                            {/* New Limit Preview */}
                            {newAgentLimit && newAgentLimit !== usage.agentsLimit && (
                                <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3">
                                    <p className="text-sm font-medium text-green-800">
                                        After granting: <span className="font-semibold">{newAgentLimit}</span> agents
                                        <span className="text-green-600 ml-1">(+{(newAgentLimit - usage.agentsLimit)})</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Add-on Plan Selector */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                                {plan.name} (+{plan.quantity.toLocaleString()}{' '}
                                {plan.addon_type === 'message_credits' ? 'messages' : 'agents'})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Quantity Selector */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Quantity <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center border border-neutral-300 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                disabled={quantity <= 1 || grantMutation.isPending}
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
                                disabled={grantMutation.isPending}
                                min={1}
                                max={100}
                                className="w-20 text-center border-x border-neutral-300 py-2 focus:outline-none disabled:bg-neutral-50 disabled:cursor-not-allowed"
                            />
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                                disabled={quantity >= 100 || grantMutation.isPending}
                                className="px-3 py-2 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                +
                            </button>
                        </div>
                        {selectedPlan && (
                            <div className="flex-1">
                                <p className="text-sm font-medium text-neutral-900">
                                    Total: {totalQuantity.toLocaleString()}{' '}
                                    {selectedPlan.addon_type === 'message_credits' ? 'messages' : 'agents'}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {selectedPlan.quantity.toLocaleString()} × {quantity}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                    <p className="text-xs text-neutral-500 mt-1">{notes.length}/1000 characters</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={grantMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!canSubmit}
                        isLoading={grantMutation.isPending}
                        className="bg-primary-600 text-white hover:bg-primary-700"
                    >
                        Grant Add-on
                    </Button>
                </div>
            </form>
        </BaseModal>
    );
}
