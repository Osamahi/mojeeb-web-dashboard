import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addonService } from '../services/addonService';
import type {
    AddonPlan,
    AddonOperation,
    CreateAddonCheckoutRequest,
    StripeCheckoutSessionResponse,
} from '../types/addon.types';

/**
 * Hook to fetch available add-ons for customer purchase
 * Only returns addons with pricing configured.
 * @param addonType Optional filter by type ('message_credits' or 'agent_slots')
 */
export function useAvailableAddons(addonType?: string) {
    return useQuery<AddonPlan[], Error>({
        queryKey: ['available-addons', addonType],
        queryFn: () => addonService.getAvailableAddons(addonType),
        staleTime: 5 * 60 * 1000, // 5 minutes - pricing doesn't change often
    });
}

/**
 * Hook to fetch current user's addon purchase history
 * Returns addon operations for the user's organization.
 */
export function useMyAddonHistory() {
    return useQuery<AddonOperation[], Error>({
        queryKey: ['my-addon-history'],
        queryFn: () => addonService.getMyAddonHistory(),
        staleTime: 1 * 60 * 1000, // 1 minute - history can be refetched more frequently
    });
}

/**
 * Hook to create a Stripe checkout session for addon purchase
 * Automatically redirects to Stripe checkout page on success.
 */
export function useCreateAddonCheckout() {
    const queryClient = useQueryClient();

    return useMutation<StripeCheckoutSessionResponse, Error, CreateAddonCheckoutRequest>({
        mutationFn: (request) => addonService.createAddonCheckout(request),
        onSuccess: (data) => {
            // Redirect to Stripe checkout page
            window.location.href = data.session_url;
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to create checkout session';
            toast.error(message);
        },
    });
}
