import { useQuery } from '@tanstack/react-query';
import { addonService } from '../services/addonService';
import type { AddonOperation, AddonOperationsFilters } from '../types/addon.types';

/**
 * Hook to fetch add-on operations with filters
 * @param filters Query filters (page, page_size, organization_id, addon_type, start_date)
 */
export function useAddonOperations(filters: AddonOperationsFilters = {}) {
    return useQuery<AddonOperation[], Error>({
        queryKey: ['addon-operations', filters],
        queryFn: () => addonService.getAddonOperations(filters),
        staleTime: 30 * 1000, // 30 seconds - operations are relatively fresh
    });
}

/**
 * Hook to fetch add-on operation history for a specific organization
 * @param organizationId Organization UUID
 */
export function useOrganizationAddonHistory(organizationId: string) {
    return useQuery<AddonOperation[], Error>({
        queryKey: ['addon-operations', organizationId],
        queryFn: () => addonService.getOrganizationHistory(organizationId),
        enabled: !!organizationId, // Only fetch if organizationId is provided
        staleTime: 30 * 1000, // 30 seconds
    });
}
