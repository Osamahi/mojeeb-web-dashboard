/**
 * Billing and Stripe-related TypeScript interfaces
 *
 * Matches backend API contracts (MojeebBackEnd/Models/Stripe/StripeDtos.cs)
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum BillingCurrency {
  USD = 'USD',
  EGP = 'EGP',
  SAR = 'SAR',
}

export enum BillingInterval {
  Monthly = 'monthly',
  Annual = 'annual',
}

export enum InvoiceStatus {
  Draft = 'draft',
  Open = 'open',
  Paid = 'paid',
  Uncollectible = 'uncollectible',
  Void = 'void',
}

// ============================================================================
// API REQUEST DTOs (frontend → backend)
// ============================================================================

/**
 * Request to create a Stripe checkout session
 */
export interface CreateCheckoutRequest {
  planId: string; // Mojeeb plan ID (GUID)
  currency: BillingCurrency;
  billingInterval: BillingInterval;
}

/**
 * Request to create a billing portal session
 */
export interface CreateBillingPortalRequest {
  returnUrl?: string; // Optional return URL after portal exit
}

/**
 * Request to cancel subscription
 */
export interface CancelSubscriptionRequest {
  cancelAtPeriodEnd: boolean; // true = cancel at period end, false = cancel immediately
}

/**
 * Request to change subscription plan
 */
export interface ChangePlanRequest {
  newPlanId: string; // New Mojeeb plan ID (GUID)
  prorate: boolean; // true = charge/credit now, false = apply at next cycle
}

/**
 * Query parameters for fetching invoices
 */
export interface GetInvoicesParams {
  limit?: number; // Number of invoices to return (1-100, default 10)
  startingAfter?: string; // Invoice ID for cursor pagination
}

// ============================================================================
// API RESPONSE DTOs (backend → frontend, snake_case from API)
// ============================================================================

/**
 * API response for checkout session creation (snake_case from backend)
 */
export interface ApiCheckoutSessionResponse {
  session_id: string; // Stripe checkout session ID (cs_...)
  session_url: string; // URL to redirect user to Stripe checkout
  expires_at: string; // ISO 8601 datetime when session expires (24 hours)
}

/**
 * API response for billing portal session creation (snake_case from backend)
 */
export interface ApiBillingPortalResponse {
  session_url: string; // URL to redirect user to Stripe billing portal
}

/**
 * API response for subscription cancellation (snake_case from backend)
 */
export interface ApiCancelSubscriptionResponse {
  success: boolean;
  subscription_id: string;
  canceled_at?: string; // ISO 8601 datetime when canceled (if immediate)
  cancel_at_period_end: boolean;
  current_period_end?: string; // ISO 8601 datetime when subscription ends
}

/**
 * API response for plan change (snake_case from backend)
 */
export interface ApiChangePlanResponse {
  success: boolean;
  subscription_id: string;
  new_plan_code: string;
  proration_amount?: number; // Amount charged/credited (in cents)
  effective_date: string; // ISO 8601 datetime when change takes effect
}

/**
 * Single invoice from API (snake_case from backend)
 */
export interface ApiInvoice {
  id: string; // Stripe invoice ID (in_...)
  number: string | null; // Invoice number (INV-001)
  amount_due: number; // Amount due in cents
  amount_paid: number; // Amount paid in cents
  currency: string; // Currency code (usd, egp, sar)
  status: InvoiceStatus;
  created: string; // ISO 8601 datetime
  period_start: string; // ISO 8601 datetime
  period_end: string; // ISO 8601 datetime
  invoice_pdf: string | null; // URL to PDF
  hosted_invoice_url: string | null; // URL to hosted invoice page
}

/**
 * API response for invoice list (snake_case from backend)
 */
export interface ApiInvoiceListResponse {
  invoices: ApiInvoice[];
  has_more: boolean; // More invoices available for pagination
  total_count: number;
}

// ============================================================================
// FRONTEND TYPES (camelCase, transformed from API responses)
// ============================================================================

/**
 * Checkout session response (camelCase for frontend use)
 */
export interface CheckoutSession {
  sessionId: string;
  sessionUrl: string;
  expiresAt: string;
}

/**
 * Billing portal session response (camelCase for frontend use)
 */
export interface BillingPortalSession {
  sessionUrl: string;
}

/**
 * Subscription cancellation result (camelCase for frontend use)
 */
export interface CancelSubscriptionResult {
  success: boolean;
  subscriptionId: string;
  canceledAt?: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string;
}

/**
 * Plan change result (camelCase for frontend use)
 */
export interface ChangePlanResult {
  success: boolean;
  subscriptionId: string;
  newPlanCode: string;
  prorationAmount?: number;
  effectiveDate: string;
}

/**
 * Single invoice (camelCase for frontend use)
 */
export interface Invoice {
  id: string;
  number: string | null;
  amountDue: number; // In cents
  amountPaid: number; // In cents
  currency: string;
  status: InvoiceStatus;
  created: string;
  periodStart: string;
  periodEnd: string;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
}

/**
 * Invoice list response (camelCase for frontend use)
 */
export interface InvoiceList {
  invoices: Invoice[];
  hasMore: boolean;
  totalCount: number;
}

// ============================================================================
// UI-SPECIFIC TYPES
// ============================================================================

/**
 * Payment method display information
 */
export interface PaymentMethodDisplay {
  brand: string; // visa, mastercard, amex, etc.
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isExpiringSoon: boolean; // Within 60 days
}

/**
 * Proration preview for plan changes
 */
export interface ProrationPreview {
  amount: number; // In cents (positive = charge, negative = credit)
  currency: string;
  effectiveDate: string;
  description: string;
}
