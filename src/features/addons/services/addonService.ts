import api from '@/lib/api';
import type {
    AddonPlan,
    AddonOperation,
    GrantAddonRequest,
    GrantAddonResult,
    AddonOperationsFilters,
    CreateAddonCheckoutRequest,
    StripeCheckoutSessionResponse,
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
        const params = addonType ? { addon_type: addonType } : {};
        const { data } = await api.get(`${API_BASE}/plans`, { params });
        return data.data ?? [];
    },

    /**
     * Create a new add-on plan (SuperAdmin only)
     * @param plan Add-on plan data
     */
    async createAddonPlan(plan: Omit<AddonPlan, 'id' | 'created_at' | 'updated_at'>): Promise<AddonPlan> {
        // Transform camelCase to snake_case for backend
        const payload = {
            code: plan.code,
            name: plan.name,
            addon_type: plan.addon_type,
            quantity: plan.quantity,
            description: plan.description,
            is_active: plan.is_active,
            display_order: plan.display_order,
            pricing: plan.pricing,
            stripe_livemode: plan.stripe_livemode,
            stripe_price_ids: plan.stripe_price_ids,
        };
        const { data } = await api.post(`${API_BASE}/plans`, payload);
        return data.data;
    },

    /**
     * Update an existing add-on plan (SuperAdmin only)
     * @param id Plan ID
     * @param plan Updated plan data
     */
    async updateAddonPlan(
        id: string,
        plan: any // Allow dynamic fields including sync_to_stripe
    ): Promise<AddonPlan> {
        // Transform camelCase to snake_case for backend
        const payload = {
            name: plan.name,
            quantity: plan.quantity,
            description: plan.description,
            is_active: plan.is_active,
            display_order: plan.display_order,
            pricing: plan.pricing,
            stripe_price_ids: plan.stripe_price_ids,
            stripe_livemode: plan.stripe_livemode,
            sync_to_stripe: plan.sync_to_stripe,
        };
        const { data } = await api.put(`${API_BASE}/plans/${id}`, payload);
        return data.data;
    },

    /**
     * Delete an add-on plan (SuperAdmin only)
     * @param id Plan ID
     */
    async deleteAddonPlan(id: string): Promise<boolean> {
        const { data } = await api.delete(`${API_BASE}/plans/${id}`);
        return data.data.success ?? false;
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

    // ==================== CUSTOMER-FACING METHODS ====================

    /**
     * Get available add-ons for customer purchase (non-admin endpoint)
     * Only returns addons with pricing configured.
     * @param addonType Optional filter by type ('message_credits' or 'agent_slots')
     */
    async getAvailableAddons(addonType?: string): Promise<AddonPlan[]> {
        const params = addonType ? { addon_type: addonType } : {};
        const { data } = await api.get('/api/addons/available', { params });
        return data.data ?? [];
    },

    /**
     * Get current user's addon purchase history (non-admin endpoint)
     * Returns addon operations for the user's organization.
     */
    async getMyAddonHistory(): Promise<AddonOperation[]> {
        const { data } = await api.get('/api/addons/my-history');
        return data.data ?? [];
    },

    /**
     * Create a Stripe checkout session for addon purchase
     * @param request Checkout request with addon_code, quantity, currency, billing_interval
     * @returns Stripe session with URL to redirect user to Stripe checkout
     */
    async createAddonCheckout(request: CreateAddonCheckoutRequest): Promise<StripeCheckoutSessionResponse> {
        const { data } = await api.post('/api/stripe/checkout-addon', request);
        return data.data; // Unwrap { session_id, session_url, expires_at }
    },
};
