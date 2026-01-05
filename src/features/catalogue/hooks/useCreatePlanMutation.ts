import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { catalogueService } from '../services/catalogueService';
import type { CreatePlanRequest, PlanCatalogueDetail } from '../types/catalogue.types';

export function useCreatePlanMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<PlanCatalogueDetail, Error, CreatePlanRequest>({
    mutationFn: (request: CreatePlanRequest) =>
      catalogueService.createPlan(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success(t('catalogue.createPlanSuccess'));
    },
    onError: (error: Error) => {
      console.error('[useCreatePlanMutation] Error:', error);
      toast.error(t('catalogue.createPlanError'));
    },
  });
}
