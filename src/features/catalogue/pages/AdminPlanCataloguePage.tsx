import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { PlanCatalogueTable } from '../components/PlanCatalogueTable';
import { AddPlanModal } from '../components/AddPlanModal';
import { EditPlanModal } from '../components/EditPlanModal';
import { useGetPlansQuery } from '../hooks/useGetPlansQuery';
import type { PlanCatalogueItem } from '../types/catalogue.types';

export function AdminPlanCataloguePage() {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanCatalogueItem | null>(null);

  // Fetch plans
  const { data: plans = [], isLoading, error } = useGetPlansQuery({});

  // Handlers (memoized for BaseHeader performance)
  const handleAddPlan = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleEditPlan = useCallback((plan: PlanCatalogueItem) => {
    setSelectedPlan(plan);
  }, []);

  const handleCloseModals = useCallback(() => {
    setShowAddModal(false);
    setSelectedPlan(null);
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-danger-50 p-4 text-danger-800">
          {t('catalogue.errorLoadingPlans')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white px-6 py-4">
        <BaseHeader
          title={t('catalogue.title')}
          subtitle={t('catalogue.subtitle')}
          primaryAction={{
            label: t('catalogue.addPlan'),
            icon: Plus,
            onClick: handleAddPlan,
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-neutral-50 p-6">
        <div className="rounded-lg bg-white shadow">
          <PlanCatalogueTable
            plans={plans}
            isLoading={isLoading}
            onEdit={handleEditPlan}
          />
        </div>
      </div>

      {/* Modals */}
      <AddPlanModal
        isOpen={showAddModal}
        onClose={handleCloseModals}
      />
      {selectedPlan && (
        <EditPlanModal
          isOpen={true}
          onClose={handleCloseModals}
          plan={selectedPlan}
        />
      )}
    </div>
  );
}
