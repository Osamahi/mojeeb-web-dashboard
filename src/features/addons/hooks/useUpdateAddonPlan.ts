import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addonService } from '../services/addonService';
import type { AddonPlan } from '../types/addon.types';
import type { ApiError } from '../types/error.types';
import { toast } from 'sonner';

/**
 * Hook to update an existing add-on plan
 */
export function useUpdateAddonPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            plan,
        }: {
            id: string;
            plan: Pick<AddonPlan, 'name' | 'quantity' | 'description' | 'is_active'>;
        }) => addonService.updateAddonPlan(id, plan),
        onSuccess: () => {
            // Invalidate addon plans queries to refetch the list
            queryClient.invalidateQueries({ queryKey: ['addon-plans'] });
            toast.success('Add-on plan updated successfully');
        },
        onError: (error: ApiError) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to update add-on plan';
            toast.error(message);
        },
    });
}
