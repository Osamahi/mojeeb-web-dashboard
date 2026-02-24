/**
 * Subscription system types and interfaces
 * Matches backend DTOs from SubscriptionController and AdminSubscriptionController
 */

export enum SubscriptionStatus {
  Active = 'active',
  Paused = 'paused',
  Canceled = 'canceled',
  Expired = 'expired',
}

export enum PlanCode {
  Free = 'free_production',
  Starter = 'starter_production',
  Professional = 'professional_production',
}

export enum Currency {
  USD = 'USD',
  EGP = 'EGP',
  SAR = 'SAR',
}

export enum BillingInterval {
  Monthly = 'monthly',
  Annual = 'annual',
}

/**
 * Subscription details DTO (from backend)
 */
export interface SubscriptionDetails {
  id: string;
  organizationId: string;
  organizationName: string;
  planCode: string;
  planName: string;
  messageLimit: number;
  agentLimit: number;
  currency: string;
  amount: number;
  billingInterval: string;
  status: string;
  paymentMethod: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  isFlaggedNonPaying: boolean;
  gracePeriodEnd: string | null;
  // Usage data (from subscription_details view, 0 if no usage record for current period)
  messagesUsed: number;
  agentsUsed: number;
}

/**
 * Usage summary DTO (from backend UsageStatsDto)
 */
export interface UsageSummary {
  messagesUsed: number;
  messagesLimit: number;
  messagesRemaining: number;
  agentsUsed: number;
  agentsLimit: number;
  agentsRemaining: number;
  messageUsagePercentage: number;
  isNearLimit: boolean;
  periodStart: string;
  periodEnd: string;
}

/**
 * Subscription plan DTO (from backend)
 */
export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  messageLimit: number;
  agentLimit: number;
  pricing: {
    [currency: string]: {
      monthly?: number;
      annual?: number;
    };
  };
  features: string[];
  isActive: boolean;
}

/**
 * Create subscription request (admin only)
 */
export interface CreateSubscriptionRequest {
  organizationId: string;
  planCode: PlanCode;
  currency: Currency;
  billingInterval: BillingInterval;
}

/**
 * Flag/unflag request
 */
export interface FlagNonPaymentRequest {
  flag: boolean;
}

/**
 * Pause/resume request
 */
export interface PauseSubscriptionRequest {
  pause: boolean;
}

/**
 * Subscription list filters (admin)
 */
export interface SubscriptionFilters {
  organizationId?: string;
  status?: SubscriptionStatus;
  planCode?: PlanCode;
  searchTerm?: string;
}
