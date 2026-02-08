import { useQuery } from '@tanstack/react-query';
import { addonService } from '../services/addonService';
import type { AddonPlan } from '../types/addon.types';

/**
 * Hook to fetch available add-on plans
 * @param addonType Optional filter by type ('message_credits' or 'agent_slots')
 */
export function useAddonPlans(addonType?: string) {
    console.log('[useAddonPlans] Hook called', { addonType });

    return useQuery<AddonPlan[], Error>({
        queryKey: ['addon-plans', addonType],
        queryFn: async () => {
            console.log('[useAddonPlans] queryFn executing, calling addonService.getAddonPlans', { addonType });
            try {
                const result = await addonService.getAddonPlans(addonType);
                console.log('[useAddonPlans] queryFn SUCCESS', {
                    resultCount: result?.length ?? 0,
                    result
                });
                return result;
            } catch (error) {
                console.error('[useAddonPlans] queryFn ERROR', error);
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - plans don't change often
    });
}
