import api from '@/lib/api';
import type {
    AddonPlan,
    AddonOperation,
    GrantAddonRequest,
    GrantAddonResult,
    AddonOperationsFilters,
} from '../types/addon.types';

const API_BASE = '/api/admin/addons';

/**
 * Add-on service for API interactions
 */
export const addonService = {
    /**
     * Get all available add-on plans
     * @param addonType Optional filter by type ('message_credits' or 'agent_slots')
     */
    async getAddonPlans(addonType?: string): Promise<AddonPlan[]> {
        console.log('[addonService.getAddonPlans] Starting API call', {
            addonType,
            apiUrl: `${API_BASE}/plans`,
        });

        try {
            const params = addonType ? { addon_type: addonType } : {};
            console.log('[addonService.getAddonPlans] Making axios.get request', { params });

            const { data } = await api.get(`${API_BASE}/plans`, { params });

            console.log('[addonService.getAddonPlans] Axios response received', {
                rawData: data,
                dataData: data.data,
                unwrappedCount: data.data?.length ?? 0,
            });

            const result = data.data ?? [];
            console.log('[addonService.getAddonPlans] Returning result', {
                resultCount: result.length,
                result,
            });

            return result;
        } catch (error) {
            console.error('[addonService.getAddonPlans] API call FAILED', error);
            throw error;
        }
    },

    /**
     * Grant an add-on to an organization
     * @param request Grant request with organization_id, addon_code, and optional notes
     */
    async grantAddon(request: GrantAddonRequest): Promise<GrantAddonResult> {
        const { data } = await api.post(`${API_BASE}/grant`, request);
        return data.data; // Unwrap from { success, data, message, timestamp }
    },

    /**
     * Get add-on operation history for a specific organization
     * @param organizationId Organization UUID
     */
    async getOrganizationHistory(organizationId: string): Promise<AddonOperation[]> {
        const { data } = await api.get(`${API_BASE}/organizations/${organizationId}/history`);
        return data.data ?? []; // Unwrap from { success, data, message, timestamp }
    },

    /**
     * Get all add-on operations with filters and pagination
     * @param filters Query filters (page, page_size, organization_id, addon_type, start_date)
     */
    async getAddonOperations(filters: AddonOperationsFilters = {}): Promise<AddonOperation[]> {
        const { data } = await api.get(`${API_BASE}/operations`, {
            params: filters,
        });
        return data.data ?? []; // Unwrap from { success, data, message, timestamp }
    },
};
