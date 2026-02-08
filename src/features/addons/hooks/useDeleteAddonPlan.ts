import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addonService } from '../services/addonService';
import type { ApiError } from '../types/error.types';
import { toast } from 'sonner';

/**
 * Hook to delete an add-on plan
 */
export function useDeleteAddonPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => addonService.deleteAddonPlan(id),
        onSuccess: () => {
            // Invalidate addon plans queries to refetch the list
            queryClient.invalidateQueries({ queryKey: ['addon-plans'] });
            toast.success('Add-on plan deleted successfully');
        },
        onError: (error: ApiError) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to delete add-on plan';
            toast.error(message);
        },
    });
}
