import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { catalogueService } from '../services/catalogueService';
import type { UpdatePlanRequest, PlanCatalogueDetail } from '../types/catalogue.types';

interface UpdatePlanVariables {
  id: string;
  request: UpdatePlanRequest;
}

export function useUpdatePlanMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<PlanCatalogueDetail, Error, UpdatePlanVariables>({
    mutationFn: ({ id, request }: UpdatePlanVariables) =>
      catalogueService.updatePlan(id, request),
    onSuccess: (data, variables) => {
      // Invalidate the plan list
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      // Invalidate the specific plan details
      queryClient.invalidateQueries({ queryKey: ['planDetails', variables.id] });
      toast.success(t('catalogue.updatePlanSuccess'));
    },
    onError: (error: Error) => {
      console.error('[useUpdatePlanMutation] Error:', error);
      toast.error(t('catalogue.updatePlanError'));
    },
  });
}
