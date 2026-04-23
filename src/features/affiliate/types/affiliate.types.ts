/**
 * Affiliate self-service types.
 *
 * Matches the backend `AffiliateRedemptionView` slim projection — callers only see
 * fields they need. Internal Stripe IDs and org IDs are intentionally absent.
 */

// Wire shape (snake_case, as returned by the API)
export interface ApiAffiliateRedemption {
  id: string;
  coupon_id: string;
  user_name: string | null;
  user_email: string | null;
  discount_amount: number | null;
  currency: string | null;
  redeemed_at: string;
  payment_succeeded_at: string | null;
}

// UI model (camelCase)
export interface AffiliateRedemption {
  id: string;
  couponId: string;
  userName: string | null;
  userEmail: string | null;
  discountAmount: number | null;
  currency: string | null;
  redeemedAt: string;
  paymentSucceededAt: string | null;
}

export interface ApiAffiliateStatus {
  is_affiliate: boolean;
}
