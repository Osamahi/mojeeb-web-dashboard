import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useUpdateAddonPlan } from '../hooks/useUpdateAddonPlan';
import type { AddonPlan } from '../types/addon.types';

interface EditAddonPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: AddonPlan | null;
}

export function EditAddonPlanModal({ isOpen, onClose, plan }: EditAddonPlanModalProps) {
    const updateMutation = useUpdateAddonPlan();

    const [formData, setFormData] = useState({
        name: '',
        quantity: 1000,
        description: '',
        is_active: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize form with plan data when plan changes
    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name,
                quantity: plan.quantity,
                description: plan.description || '',
                is_active: plan.is_active,
            });
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

        updateMutation.mutate(
            { id: plan.id, plan: formData },
            {
                onSuccess: () => {
                    onClose();
                },
            }
        );
    };

    if (!plan) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Add-on Plan"
            subtitle={`Updating plan: ${plan.code}`}
            maxWidth="md"
            isLoading={updateMutation.isPending}
            closable={!updateMutation.isPending}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
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
