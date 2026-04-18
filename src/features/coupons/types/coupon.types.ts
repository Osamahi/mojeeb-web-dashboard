/**
 * Coupon feature types.
 *
 * Wire shape uses snake_case (matches the backend Newtonsoft.Json convention).
 * Frontend models use camelCase — services transform between the two.
 */

// ============================================================================
// Shared enums / string literal unions
// ============================================================================

export type CouponDiscountType = 'percent' | 'amount';
export type CouponDuration = 'once' | 'repeating' | 'forever';
export type AttributionSource = 'code_entry' | 'ref_link' | 'auto_applied' | 'admin_granted';

// ============================================================================
// Pagination (shared shape — matches Infrastructure/Pagination/CursorPaginatedResponse<T>)
// ============================================================================

export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Raw wire shape before snake_case → camelCase transformation.
export interface ApiCursorPaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

// ============================================================================
// Coupon (frontend model — camelCase)
// ============================================================================

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  stripeCouponId: string;
  stripePromotionCodeId: string;
  discountType: CouponDiscountType;
  percentOff: number | null;
  /** Map of ISO currency code → amount in smallest currency unit (cents). */
  amountOffByCurrency: Record<string, number> | null;
  duration: CouponDuration;
  durationInMonths: number | null;
  appliesToPlanIds: string[] | null;
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number | null;
  expiresAt: string | null;
  affiliateUserId: string | null;
  /** Display name of the affiliate user (populated by the list RPCs' LEFT JOIN). */
  affiliateUserName: string | null;
  /** Email of the affiliate user (populated by the list RPCs' LEFT JOIN). */
  affiliateUserEmail: string | null;
  lockedToUserId: string | null;
  lockedToUserName: string | null;
  lockedToUserEmail: string | null;
  active: boolean;
  timesRedeemed: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

// Raw wire shape.
export interface ApiCoupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  stripe_coupon_id: string;
  stripe_promotion_code_id: string;
  discount_type: CouponDiscountType;
  percent_off: number | null;
  amount_off_by_currency: Record<string, number> | null;
  duration: CouponDuration;
  duration_in_months: number | null;
  applies_to_plan_ids: string[] | null;
  max_redemptions: number | null;
  max_redemptions_per_user: number | null;
  expires_at: string | null;
  affiliate_user_id: string | null;
  affiliate_user_name: string | null;
  affiliate_user_email: string | null;
  locked_to_user_id: string | null;
  locked_to_user_name: string | null;
  locked_to_user_email: string | null;
  active: boolean;
  times_redeemed: number;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Coupon Redemption
// ============================================================================

export interface CouponRedemption {
  id: string;
  couponId: string;
  userId: string;
  /** Name of the redeeming user (populated by RPCs' LEFT JOIN). */
  userName: string | null;
  /** Email of the redeeming user (populated by RPCs' LEFT JOIN). */
  userEmail: string | null;
  organizationId: string;
  subscriptionId: string | null;
  stripeCustomerId: string;
  stripeInvoiceId: string | null;
  stripeDiscountId: string | null;
  stripeCheckoutSessionId: string | null;
  discountAmount: number | null;
  currency: string | null;
  affiliateUserId: string | null;
  affiliateUserName: string | null;
  affiliateUserEmail: string | null;
  attributionSource: AttributionSource;
  redeemedAt: string;
  paymentSucceededAt: string | null;
}

export interface ApiCouponRedemption {
  id: string;
  coupon_id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  organization_id: string;
  subscription_id: string | null;
  stripe_customer_id: string;
  stripe_invoice_id: string | null;
  stripe_discount_id: string | null;
  stripe_checkout_session_id: string | null;
  discount_amount: number | null;
  currency: string | null;
  affiliate_user_id: string | null;
  affiliate_user_name: string | null;
  affiliate_user_email: string | null;
  attribution_source: AttributionSource;
  redeemed_at: string;
  payment_succeeded_at: string | null;
}

// ============================================================================
// Request payloads (camelCase in the frontend; service transforms to snake_case)
// ============================================================================

export interface CreateCouponRequest {
  code: string;
  name: string;
  description?: string | null;
  discountType: CouponDiscountType;
  percentOff?: number | null;
  amountOffByCurrency?: Record<string, number> | null;
  duration: CouponDuration;
  durationInMonths?: number | null;
  appliesToPlanIds?: string[] | null;
  maxRedemptions?: number | null;
  maxRedemptionsPerUser?: number | null;
  expiresAt?: string | null;
  affiliateUserId?: string | null;
  lockedToUserId?: string | null;
}

export interface UpdateCouponRequest {
  id: string;
  name?: string | null;
  description?: string | null;
  appliesToPlanIds?: string[] | null;
  maxRedemptions?: number | null;
  maxRedemptionsPerUser?: number | null;
  expiresAt?: string | null;
  affiliateUserId?: string | null;
  lockedToUserId?: string | null;
  active?: boolean;
}

export interface CouponListFilters {
  active?: boolean;
  affiliateUserId?: string;
  search?: string;
}

// ============================================================================
// Validation (customer-facing pre-checkout)
// ============================================================================

export interface ValidateCouponRequest {
  code: string;
  planId: string;
  currency: string;
  billingInterval: 'monthly' | 'annual';
}

export interface CouponValidationResult {
  valid: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  // preview (only present when valid)
  couponId: string | null;
  code: string | null;
  discountType: CouponDiscountType | null;
  percentOff: number | null;
  amountOff: number | null;
  currency: string | null;
  duration: CouponDuration | null;
  durationInMonths: number | null;
}

export interface ApiCouponValidationResult {
  valid: boolean;
  error_code: string | null;
  error_message: string | null;
  coupon_id: string | null;
  code: string | null;
  discount_type: CouponDiscountType | null;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  duration: CouponDuration | null;
  duration_in_months: number | null;
}
