import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addonService } from '../services/addonService';
import type { GrantAddonRequest, GrantAddonResult } from '../types/addon.types';
import type { ApiError } from '../types/error.types';

/**
 * Hook to grant an add-on to an organization
 * Invalidates relevant queries on success
 */
export function useGrantAddonMutation() {
    const queryClient = useQueryClient();

    return useMutation<GrantAddonResult, Error, GrantAddonRequest>({
        mutationFn: (request) => addonService.grantAddon(request),
        onSuccess: (data, variables) => {
            toast.success(data.message || 'Add-on granted successfully');

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['addon-operations'] });
            queryClient.invalidateQueries({
                queryKey: ['addon-operations', variables.organization_id]
            });
            queryClient.invalidateQueries({
                queryKey: ['subscription', variables.organization_id]
            });
        },
        onError: (error: ApiError) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to grant add-on';
            toast.error(message);
        },
    });
}
