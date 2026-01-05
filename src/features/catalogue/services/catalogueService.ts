import api from '@/lib/api';
import type {
  PlanCatalogueItem,
  PlanCatalogueDetail,
  CreatePlanRequest,
  UpdatePlanRequest,
  ApiPlanCatalogueItem,
  ApiPlanCatalogueDetail,
  ApiCreatePlanRequest,
  ApiUpdatePlanRequest,
} from '../types/catalogue.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

class CatalogueService {
  /**
   * Get all subscription plans
   */
  async getAllPlans(params?: {
    activeOnly?: boolean;
    search?: string;
  }): Promise<PlanCatalogueItem[]> {
    const response = await api.get<ApiResponse<ApiPlanCatalogueItem[]>>(
      '/api/admin/plans',
      { params }
    );

    return response.data.data.map(this.transformPlanListItem);
  }

  /**
   * Get plan details by ID
   */
  async getPlanById(id: string): Promise<PlanCatalogueDetail> {
    const response = await api.get<ApiResponse<ApiPlanCatalogueDetail>>(
      `/api/admin/plans/${id}`
    );

    return this.transformPlanDetail(response.data.data);
  }

  /**
   * Create new plan
   */
  async createPlan(request: CreatePlanRequest): Promise<PlanCatalogueDetail> {
    const apiRequest: ApiCreatePlanRequest = {
      code: request.code,
      name: request.name,
      description: request.description,
      message_limit: request.messageLimit,
      agent_limit: request.agentLimit,
      trial_days: request.trialDays,
      pricing: request.pricing,
      features: request.features,
      stripe_price_ids: request.stripePriceIds,
    };

    const response = await api.post<ApiResponse<ApiPlanCatalogueDetail>>(
      '/api/admin/plans',
      apiRequest
    );

    return this.transformPlanDetail(response.data.data);
  }

  /**
   * Update existing plan
   */
  async updatePlan(
    id: string,
    request: UpdatePlanRequest
  ): Promise<PlanCatalogueDetail> {
    const apiRequest: ApiUpdatePlanRequest = {
      name: request.name,
      description: request.description,
      message_limit: request.messageLimit,
      agent_limit: request.agentLimit,
      trial_days: request.trialDays,
      pricing: request.pricing,
      features: request.features,
      stripe_price_ids: request.stripePriceIds,
      is_active: request.isActive,
    };

    const response = await api.patch<ApiResponse<ApiPlanCatalogueDetail>>(
      `/api/admin/plans/${id}`,
      apiRequest
    );

    return this.transformPlanDetail(response.data.data);
  }

  /**
   * Archive plan (soft delete)
   */
  async archivePlan(id: string): Promise<void> {
    await api.delete(`/api/admin/plans/${id}`);
  }

  // ========================================
  // Transform helpers (snake_case → camelCase)
  // ========================================

  private transformPlanListItem(
    apiItem: ApiPlanCatalogueItem
  ): PlanCatalogueItem {
    return {
      id: apiItem.id,
      code: apiItem.code,
      name: apiItem.name,
      description: apiItem.description,
      messageLimit: apiItem.message_limit,
      agentLimit: apiItem.agent_limit,
      trialDays: apiItem.trial_days,
      isActive: apiItem.is_active,
      createdAt: apiItem.created_at,
      updatedAt: apiItem.updated_at,
    };
  }

  private transformPlanDetail(
    apiDetail: ApiPlanCatalogueDetail
  ): PlanCatalogueDetail {
    return {
      ...this.transformPlanListItem(apiDetail),
      pricing: apiDetail.pricing,
      features: apiDetail.features,
      stripePriceIds: apiDetail.stripe_price_ids,
    };
  }
}

export const catalogueService = new CatalogueService();
