// ========================================
// Frontend Types (camelCase)
// ========================================

export interface PlanCatalogueItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  messageLimit: number;
  agentLimit: number;
  trialDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanCatalogueDetail extends PlanCatalogueItem {
  pricing: PricingMatrix;
  features: Record<string, boolean>;
  stripePriceIds?: StripePriceIds;
}

export type PricingMatrix = Record<Currency, Record<BillingInterval, number>>;
export type StripePriceIds = Record<Currency, Record<BillingInterval, string>>;

export enum Currency {
  USD = 'USD',
  EGP = 'EGP',
  SAR = 'SAR',
}

export enum BillingInterval {
  Monthly = 'monthly',
  Annual = 'annual',
}

export interface CreatePlanRequest {
  code: string;
  name: string;
  description?: string;
  messageLimit: number;
  agentLimit: number;
  trialDays: number;
  pricing?: PricingMatrix;
  features?: Record<string, boolean>;
  stripePriceIds?: StripePriceIds;
}

export interface UpdatePlanRequest {
  name?: string;
  description?: string;
  messageLimit?: number;
  agentLimit?: number;
  trialDays?: number;
  pricing?: PricingMatrix;
  features?: Record<string, boolean>;
  stripePriceIds?: StripePriceIds;
  isActive?: boolean;
}

// ========================================
// API Types (snake_case)
// ========================================

export interface ApiPlanCatalogueItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  message_limit: number;
  agent_limit: number;
  trial_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiPlanCatalogueDetail extends ApiPlanCatalogueItem {
  pricing: ApiPricingMatrix;
  features: Record<string, boolean>;
  stripe_price_ids?: ApiStripePriceIds;
}

export type ApiPricingMatrix = Record<Currency, Record<BillingInterval, number>>;
export type ApiStripePriceIds = Record<Currency, Record<BillingInterval, string>>;

export interface ApiCreatePlanRequest {
  code: string;
  name: string;
  description?: string;
  message_limit: number;
  agent_limit: number;
  trial_days: number;
  pricing?: ApiPricingMatrix;
  features?: Record<string, boolean>;
  stripe_price_ids?: ApiStripePriceIds;
}

export interface ApiUpdatePlanRequest {
  name?: string;
  description?: string;
  message_limit?: number;
  agent_limit?: number;
  trial_days?: number;
  pricing?: ApiPricingMatrix;
  features?: Record<string, boolean>;
  stripe_price_ids?: ApiStripePriceIds;
  is_active?: boolean;
}
