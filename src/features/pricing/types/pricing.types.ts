/**
 * Pricing and Stripe product types for admin pricing management.
 * Backend uses snake_case, frontend uses camelCase.
 */

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
 * Stripe environment mode for switching between test and production.
 * Matches backend StripeEnvironmentMode enum (0 = Test, 1 = Production).
 */
export enum StripeEnvironmentMode {
  Test = 0,
  Production = 1,
}

export type StripeEnvironmentModeKey = 'test' | 'production';

/**
 * Detailed information about a single Stripe price.
 * Amount is in cents (USD) or smallest currency unit (e.g., piasters for EGP).
 */
export interface StripePriceDetail {
  priceId: string;
  amount: number; // Amount in cents/smallest currency unit
  currency: string;
  interval: string; // 'month', 'year', 'one_time'
  isActive: boolean;
}

/**
 * Monthly and annual prices for a specific currency.
 */
export interface StripeCurrencyPrices {
  monthly?: StripePriceDetail;
  annual?: StripePriceDetail;
}

/**
 * Stripe product with all associated prices grouped by currency.
 * Used by SuperAdmin to view current Stripe pricing configuration.
 */
export interface StripeProductWithPrices {
  stripeProductId: string;
  name: string;
  description?: string;
  isActive: boolean;
  prices: Record<string, StripeCurrencyPrices>; // Key: Currency code (USD, EGP, SAR)
}

/**
 * API response from backend for pricing data.
 * Backend returns snake_case fields.
 */
export interface ApiStripePriceDetail {
  price_id: string;
  amount: number;
  currency: string;
  interval: string;
  is_active: boolean;
}

export interface ApiStripeCurrencyPrices {
  monthly?: ApiStripePriceDetail;
  annual?: ApiStripePriceDetail;
}

export interface ApiStripeProductWithPrices {
  stripe_product_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  prices: Record<string, ApiStripeCurrencyPrices>;
}

/**
 * Request to create a new Stripe product.
 * Frontend uses camelCase, backend expects snake_case.
 */
export interface CreateStripeProductRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

/**
 * API request for creating Stripe product (snake_case).
 */
export interface ApiCreateStripeProductRequest {
  name: string;
  description?: string;
  is_active: boolean;
}

/**
 * Request to update an existing Stripe product.
 * Frontend uses camelCase, backend expects snake_case.
 */
export interface UpdateStripeProductRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

/**
 * API request for updating Stripe product (snake_case).
 */
export interface ApiUpdateStripeProductRequest {
  name: string;
  description?: string;
  is_active: boolean;
}

/**
 * Filters for pricing data.
 */
export interface PricingFilters {
  productName?: string;
  currency?: Currency;
  isActive?: boolean;
}

/**
 * Formatted price display.
 */
export interface FormattedPrice {
  monthly?: string;
  annual?: string;
}

/**
 * Request to create a new recurring price for a Stripe product.
 * Frontend uses camelCase, backend expects snake_case.
 */
export interface CreateStripePriceRequest {
  productId: string;
  amount: number; // In cents/smallest currency unit
  currency: Currency;
  billingInterval: BillingInterval;
  isActive?: boolean;
}

/**
 * API request for creating Stripe price (snake_case).
 */
export interface ApiCreateStripePriceRequest {
  product_id: string;
  amount: number;
  currency: string;
  billing_interval: string;
  is_active?: boolean;
}

/**
 * Request to update an existing Stripe price.
 * Currently only supports updating the active status.
 */
export interface UpdateStripePriceRequest {
  isActive: boolean;
}

/**
 * API request for updating Stripe price (snake_case).
 */
export interface ApiUpdateStripePriceRequest {
  is_active: boolean;
}
