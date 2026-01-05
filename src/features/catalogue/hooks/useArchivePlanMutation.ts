import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { catalogueService } from '../services/catalogueService';

export function useArchivePlanMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => catalogueService.archivePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success(t('catalogue.archivePlanSuccess'));
    },
    onError: (error: Error) => {
      console.error('[useArchivePlanMutation] Error:', error);
      toast.error(t('catalogue.archivePlanError'));
    },
  });
}
