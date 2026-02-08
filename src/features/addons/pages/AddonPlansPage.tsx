/**
 * AddonPlansPage Component
 * Architecture: Isolated components prevent unnecessary re-renders
 * - BaseHeader: Static, never re-renders
 * - AddonPlansTableView: Only re-renders when data changes
 */

import { useState, useCallback } from 'react';
import { useAddonPlans } from '../hooks/useAddonPlans';
import { useDeleteAddonPlan } from '../hooks/useDeleteAddonPlan';
import { Plus } from 'lucide-react';
import type { AddonPlan } from '../types/addon.types';
import { AddAddonPlanModal } from '../components/AddAddonPlanModal';
import { EditAddonPlanModal } from '../components/EditAddonPlanModal';
import { AddonPlansTableView } from '../components/AddonPlansTableView';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function AddonPlansPage() {
    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<AddonPlan | null>(null);
    const [planToDelete, setPlanToDelete] = useState<AddonPlan | null>(null);

    // Fetch data
    const { data: plans, isLoading, error } = useAddonPlans();
    const deleteMutation = useDeleteAddonPlan();

    // ========================================
    // Memoized Callbacks (prevent child re-renders)
    // ========================================

    const handleCreateClick = useCallback(() => {
        setIsCreateModalOpen(true);
    }, []);

    const handleEditClick = useCallback((plan: AddonPlan) => {
        setSelectedPlan(plan);
        setIsEditModalOpen(true);
    }, []);

    const handleDeleteClick = useCallback((plan: AddonPlan) => {
        setPlanToDelete(plan);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (!planToDelete) return;
        deleteMutation.mutate(planToDelete.id, {
            onSuccess: () => {
                setPlanToDelete(null);
            },
        });
    }, [planToDelete, deleteMutation]);

    // ========================================
    // Render Logic
    // ========================================

    return (
        <div className="p-6 space-y-6">
            {/* Static Header - never re-renders */}
            <BaseHeader
                title="Add-on Plans"
                subtitle="Available add-on packages to extend organization capacity"
                primaryAction={{
                    label: 'Create Plan',
                    icon: Plus,
                    onClick: handleCreateClick,
                }}
            />

            {/* Table View - only re-renders when data changes */}
            <AddonPlansTableView
                plans={plans}
                isLoading={isLoading}
                error={error}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                onCreateClick={handleCreateClick}
                isDeleting={deleteMutation.isPending}
            />

            {/* Modals */}
            <AddAddonPlanModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <EditAddonPlanModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedPlan(null);
                }}
                plan={selectedPlan}
            />

            <ConfirmDialog
                isOpen={!!planToDelete}
                title="Delete Add-on Plan"
                message={`Are you sure you want to delete "${planToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Plan"
                onConfirm={handleConfirmDelete}
                onCancel={() => setPlanToDelete(null)}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
