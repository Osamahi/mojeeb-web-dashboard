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
  // Stripe product metadata (for showing "Testing" or "Production" in table)
  stripeProductId?: string;
  stripeLivemode?: boolean;
}

export interface PlanCatalogueDetail extends PlanCatalogueItem {
  pricing: PricingMatrix;
  features: Record<string, boolean>;
  stripePriceIds?: StripePriceIds;
  // Stripe product metadata (Jan 2026)
  stripeProductId?: string;
  stripeProductName?: string;
  stripeProductDescription?: string;
  stripeCreatedAt?: string;
  stripeUpdatedAt?: string;
  stripeLivemode?: boolean;
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
  // Stripe product linking
  stripeProductId?: string;
  stripeProductName?: string;
  stripeProductDescription?: string;
  stripeCreatedAt?: string;
  stripeUpdatedAt?: string;
  stripeLivemode?: boolean;
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
  // Stripe product linking
  stripeProductId?: string;
  stripeProductName?: string;
  stripeProductDescription?: string;
  stripeLivemode?: boolean;
  syncToStripe?: boolean; // Flag to sync to Stripe when saving
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
  // Stripe product metadata (snake_case from API)
  stripe_product_id?: string;
  stripe_livemode?: boolean;
}

export interface ApiPlanCatalogueDetail extends ApiPlanCatalogueItem {
  pricing: ApiPricingMatrix;
  features: Record<string, boolean>;
  stripe_price_ids?: ApiStripePriceIds;
  // Stripe product metadata (snake_case from API)
  stripe_product_id?: string;
  stripe_product_name?: string;
  stripe_product_description?: string;
  stripe_created_at?: string;
  stripe_updated_at?: string;
  stripe_livemode?: boolean;
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
  // Stripe product linking (snake_case for API)
  stripe_product_id?: string;
  stripe_product_name?: string;
  stripe_product_description?: string;
  stripe_created_at?: string;
  stripe_updated_at?: string;
  stripe_livemode?: boolean;
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
  // Stripe product linking (snake_case for API)
  stripe_product_id?: string;
  stripe_product_name?: string;
  stripe_product_description?: string;
  stripe_livemode?: boolean;
  sync_to_stripe?: boolean; // Flag to sync to Stripe when saving
}
