import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addonService } from '../services/addonService';
import type { GrantAddonRequest, GrantAddonResult } from '../types/addon.types';

/**
 * Hook to grant an add-on to an organization
 * Invalidates relevant queries on success
 */
export function useGrantAddonMutation() {
    const queryClient = useQueryClient();

    return useMutation<GrantAddonResult, Error, GrantAddonRequest>({
        mutationFn: (request) => addonService.grantAddon(request),
        onSuccess: (data, variables) => {
            // Log success (toast notification can be added later)
            console.log('Add-on granted successfully:', data.message);

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['addon-operations'] });
            queryClient.invalidateQueries({
                queryKey: ['addon-operations', variables.organization_id]
            });
            queryClient.invalidateQueries({
                queryKey: ['subscription', variables.organization_id]
            });
        },
        onError: (error) => {
            // Log error (toast notification can be added later)
            console.error('Failed to grant add-on:', error.message);
        },
    });
}
