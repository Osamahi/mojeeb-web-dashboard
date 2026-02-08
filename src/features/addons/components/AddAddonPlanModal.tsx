import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useCreateAddonPlan } from '../hooks/useCreateAddonPlan';
import type { AddonType } from '../types/addon.types';

interface AddAddonPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddAddonPlanModal({ isOpen, onClose }: AddAddonPlanModalProps) {
    const createMutation = useCreateAddonPlan();

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        addon_type: 'message_credits' as AddonType,
        quantity: 1000,
        description: '',
        is_active: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

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
            });
            setErrors({});
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

        createMutation.mutate(formData, {
            onSuccess: () => {
                onClose(); // Form will be reset via useEffect
            },
        });
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Add-on Plan"
            subtitle="Define a new add-on package for organizations"
            maxWidth="md"
            isLoading={createMutation.isPending}
            closable={!createMutation.isPending}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    <p className="mt-1 text-xs text-neutral-500">
                        Unique identifier (lowercase, numbers, underscores only)
                    </p>
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
                    <p className="mt-1 text-xs text-neutral-500">
                        Number of {formData.addon_type === 'message_credits' ? 'messages' : 'agent slots'} to grant
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
