import api from '@/lib/api';
import { detectCountryFromTimezone } from '@/features/onboarding/utils/countryDetector';
import type {
  SubscriptionDetails,
  UsageSummary,
  SubscriptionPlan,
  CreateSubscriptionRequest,
  FlagNonPaymentRequest,
  PauseSubscriptionRequest,
  SubscriptionFilters,
} from '../types/subscription.types';

// API Response Types (snake_case from backend)
interface ApiSubscriptionResponse {
  id: string;
  organization_id: string;
  organization_name: string;
  plan_code: string;
  plan_name: string;
  message_limit: number;
  agent_limit: number;
  currency: string;
  amount: number;
  billing_interval: string;
  status: string;
  payment_method: string;
  current_period_start: string;
  current_period_end: string;
  is_flagged_non_paying: boolean;
  grace_period_end: string | null;
}

interface ApiUsageResponse {
  messages_used: number;
  message_limit: number;
  messages_remaining: number;
  agents_used: number;
  agent_limit: number;
  agents_remaining: number;
  message_usage_percent: number;
  is_near_limit: boolean;
  period_start: string;
  period_end: string;
}

interface ApiPlanResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  message_limit: number;
  agent_limit: number;
  trial_days: number;
  pricing: {
    currency: string;
    monthly: number;
    annual: number;
    annual_savings: number;
  };
  has_analytics: boolean;
  has_priority_support: boolean;
  has_api_access: boolean;
  is_active: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

interface PaginatedApiResponse<T> {
  data: T[];
  pagination: {
    page: number;
    page_size: number;      // Backend uses snake_case
    total_count: number;    // Backend uses snake_case
    total_pages: number;    // Backend uses snake_case
    has_next: boolean;      // Backend uses snake_case
    has_previous: boolean;  // Backend uses snake_case
  };
  timestamp: string;
}

/**
 * Subscription Service
 * Handles all subscription-related API calls for both customers and admins
 */
class SubscriptionService {
  /**
   * Customer Endpoints
   */

  /**
   * Get current user's subscription and usage data in one call
   * GET /api/subscriptions/me
   */
  async getMySubscriptionWithUsage(): Promise<{
    subscription: SubscriptionDetails;
    usage: UsageSummary;
  }> {
    const response = await api.get<ApiResponse<{
      subscription: ApiSubscriptionResponse;
      usage: ApiUsageResponse;
    }>>(
      '/api/subscriptions/me'
    );

    return {
      subscription: this.transformSubscriptionResponse(response.data.data.subscription),
      usage: this.transformUsageResponse(response.data.data.usage),
    };
  }

  /**
   * Get all available subscription plans with auto-detected currency
   * GET /api/subscriptions/plans?countryCode=EG
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    // Auto-detect country from browser timezone
    const countryCode = detectCountryFromTimezone();

    const response = await api.get<ApiResponse<ApiPlanResponse[]>>(
      `/api/subscriptions/plans?countryCode=${countryCode}`
    );
    return response.data.data.map((plan) => this.transformPlanResponse(plan));
  }

  /**
   * Change plan (upgrade or downgrade)
   * POST /api/subscriptions/change-plan
   */
  async changePlan(
    newPlanCode: string,
    newCurrency?: string,
    newBillingInterval?: string
  ): Promise<SubscriptionDetails> {
    const payload = {
      new_plan_code: newPlanCode,
      new_currency: newCurrency,
      new_billing_interval: newBillingInterval,
    };

    console.log('🔄 changePlan request:', payload);

    const response = await api.post<ApiResponse<ApiSubscriptionResponse>>(
      '/api/subscriptions/change-plan',
      payload
    );
    return this.transformSubscriptionResponse(response.data.data);
  }

  /**
   * Admin Endpoints (SuperAdmin only)
   */

  /**
   * Create a new subscription for an organization
   * POST /api/admin/subscriptions
   */
  async createSubscription(
    request: CreateSubscriptionRequest
  ): Promise<SubscriptionDetails> {
    const response = await api.post<ApiResponse<ApiSubscriptionResponse>>(
      '/api/admin/subscriptions',
      request
    );
    return this.transformSubscriptionResponse(response.data.data);
  }

  /**
   * Get all subscriptions with optional filters and pagination
   * GET /api/admin/subscriptions?page=1&pageSize=50&organizationId=...&status=...&planCode=...
   */
  async getAllSubscriptions(
    filters?: SubscriptionFilters,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{
    items: SubscriptionDetails[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    const params = new URLSearchParams();

    // Add pagination params
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    // Add filters
    if (filters?.organizationId) {
      params.append('organizationId', filters.organizationId);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.planCode) {
      params.append('planCode', filters.planCode);
    }
    if (filters?.searchTerm) {
      params.append('search', filters.searchTerm);
    }

    console.log('🔍 getAllSubscriptions - Filters:', filters);
    console.log('🔍 getAllSubscriptions - URL:', `/api/admin/subscriptions?${params.toString()}`);

    const response = await api.get<PaginatedApiResponse<ApiSubscriptionResponse>>(
      `/api/admin/subscriptions?${params.toString()}`
    );

    return {
      items: response.data.data.map((sub) =>
        this.transformSubscriptionResponse(sub)
      ),
      pagination: {
        page: response.data.pagination.page,
        pageSize: response.data.pagination.page_size,
        totalCount: response.data.pagination.total_count,
        totalPages: response.data.pagination.total_pages,
        hasNext: response.data.pagination.has_next,
        hasPrevious: response.data.pagination.has_previous,
      },
    };
  }

  /**
   * Flag or unflag a subscription for non-payment
   * PATCH /api/admin/subscriptions/{id}/flag
   */
  async flagSubscription(
    id: string,
    flag: boolean
  ): Promise<void> {
    const request: FlagNonPaymentRequest = { flag };
    await api.patch(`/api/admin/subscriptions/${id}/flag`, request);
  }

  /**
   * Pause or resume a subscription
   * PATCH /api/admin/subscriptions/{id}/pause
   */
  async pauseSubscription(
    id: string,
    pause: boolean
  ): Promise<void> {
    const request: PauseSubscriptionRequest = { pause };
    await api.patch(`/api/admin/subscriptions/${id}/pause`, request);
  }

  /**
   * Manually renew a subscription
   * POST /api/admin/subscriptions/{id}/renew
   */
  async renewSubscription(id: string): Promise<SubscriptionDetails> {
    const response = await api.post<ApiResponse<ApiSubscriptionResponse>>(
      `/api/admin/subscriptions/${id}/renew`
    );
    return this.transformSubscriptionResponse(response.data.data);
  }

  /**
   * Private helper methods for transforming API responses
   */

  private transformSubscriptionResponse(
    apiResponse: ApiSubscriptionResponse
  ): SubscriptionDetails {
    return {
      id: apiResponse.id,
      organizationId: apiResponse.organization_id,
      organizationName: apiResponse.organization_name,
      planCode: apiResponse.plan_code,
      planName: apiResponse.plan_name,
      messageLimit: apiResponse.message_limit,
      agentLimit: apiResponse.agent_limit,
      currency: apiResponse.currency,
      amount: apiResponse.amount,
      billingInterval: apiResponse.billing_interval,
      status: apiResponse.status,
      paymentMethod: apiResponse.payment_method,
      currentPeriodStart: apiResponse.current_period_start,
      currentPeriodEnd: apiResponse.current_period_end,
      isFlaggedNonPaying: apiResponse.is_flagged_non_paying,
      gracePeriodEnd: apiResponse.grace_period_end,
    };
  }

  private transformUsageResponse(apiResponse: ApiUsageResponse): UsageSummary {
    return {
      messagesUsed: apiResponse.messages_used,
      messagesLimit: apiResponse.message_limit,
      messagesRemaining: apiResponse.messages_remaining,
      agentsUsed: apiResponse.agents_used,
      agentsLimit: apiResponse.agent_limit,
      agentsRemaining: apiResponse.agents_remaining,
      messageUsagePercentage: apiResponse.message_usage_percent,
      isNearLimit: apiResponse.is_near_limit,
      periodStart: apiResponse.period_start,
      periodEnd: apiResponse.period_end,
    };
  }

  private transformPlanResponse(apiResponse: ApiPlanResponse): SubscriptionPlan {
    // Transform flat pricing structure from backend to nested structure expected by frontend
    // Backend: { currency: "USD", monthly: 99, annual: 990 }
    // Frontend: { USD: { monthly: 99, annual: 990 } }
    const pricing: { [currency: string]: { monthly?: number; annual?: number } } = {};

    if (apiResponse.pricing) {
      const currency = apiResponse.pricing.currency;
      pricing[currency] = {
        monthly: apiResponse.pricing.monthly,
        annual: apiResponse.pricing.annual,
      };
    }

    // Transform features from boolean flags to array of strings
    const features: string[] = [];
    if (apiResponse.has_analytics) features.push('analytics');
    if (apiResponse.has_priority_support) features.push('priority_support');
    if (apiResponse.has_api_access) features.push('api_access');

    return {
      id: apiResponse.id,
      code: apiResponse.code,
      name: apiResponse.name,
      description: apiResponse.description,
      messageLimit: apiResponse.message_limit,
      agentLimit: apiResponse.agent_limit,
      pricing,
      features,
      isActive: apiResponse.is_active,
    };
  }
}

// Export a singleton instance
export const subscriptionService = new SubscriptionService();
