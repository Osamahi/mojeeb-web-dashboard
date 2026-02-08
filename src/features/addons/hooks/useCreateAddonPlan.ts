import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addonService } from '../services/addonService';
import type { AddonPlan } from '../types/addon.types';
import type { ApiError } from '../types/error.types';
import { toast } from 'sonner';

/**
 * Hook to create a new add-on plan
 */
export function useCreateAddonPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (plan: Omit<AddonPlan, 'id' | 'created_at' | 'updated_at'>) =>
            addonService.createAddonPlan(plan),
        onSuccess: () => {
            // Invalidate addon plans queries to refetch the list
            queryClient.invalidateQueries({ queryKey: ['addon-plans'] });
            toast.success('Add-on plan created successfully');
        },
        onError: (error: ApiError) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to create add-on plan';
            toast.error(message);
        },
    });
}
