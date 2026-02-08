import { useQuery } from '@tanstack/react-query';
import { addonService } from '../services/addonService';
import type { AddonPlan } from '../types/addon.types';

/**
 * Hook to fetch available add-on plans
 * @param addonType Optional filter by type ('message_credits' or 'agent_slots')
 */
export function useAddonPlans(addonType?: string) {
    return useQuery<AddonPlan[], Error>({
        queryKey: ['addon-plans', addonType],
        queryFn: () => addonService.getAddonPlans(addonType),
        staleTime: 5 * 60 * 1000, // 5 minutes - plans don't change often
    });
}
