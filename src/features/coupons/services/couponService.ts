/**
 * Coupon service
 * API adapter for admin coupon CRUD and customer-facing validation.
 *
 * Wire format: snake_case (matches backend Newtonsoft convention).
 * This service transforms between snake_case (API) and camelCase (UI) and wraps
 * the shared cursor-pagination shape.
 */

import api from '@/lib/api';
import type {
  ApiCoupon,
  ApiCouponRedemption,
  ApiCouponValidationResult,
  ApiCursorPaginatedResponse,
  Coupon,
  CouponListFilters,
  CouponRedemption,
  CouponValidationResult,
  CreateCouponRequest,
  CursorPaginatedResponse,
  UpdateCouponRequest,
  ValidateCouponRequest,
} from '../types/coupon.types';

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

class CouponService {
  // --------------------------------------------------------------------------
  // Transformations
  // --------------------------------------------------------------------------

  private toCoupon(api: ApiCoupon): Coupon {
    return {
      id: api.id,
      code: api.code,
      name: api.name,
      description: api.description,
      stripeCouponId: api.stripe_coupon_id,
      stripePromotionCodeId: api.stripe_promotion_code_id,
      discountType: api.discount_type,
      percentOff: api.percent_off,
      amountOffByCurrency: api.amount_off_by_currency,
      duration: api.duration,
      durationInMonths: api.duration_in_months,
      appliesToPlanIds: api.applies_to_plan_ids,
      maxRedemptions: api.max_redemptions,
      maxRedemptionsPerUser: api.max_redemptions_per_user,
      expiresAt: api.expires_at,
      affiliateUserId: api.affiliate_user_id,
      affiliateUserName: api.affiliate_user_name,
      affiliateUserEmail: api.affiliate_user_email,
      lockedToUserId: api.locked_to_user_id,
      lockedToUserName: api.locked_to_user_name,
      lockedToUserEmail: api.locked_to_user_email,
      active: api.active,
      timesRedeemed: api.times_redeemed,
      stripeLivemode: api.stripe_livemode,
      createdByUserId: api.created_by_user_id,
      createdAt: api.created_at,
      updatedAt: api.updated_at,
    };
  }

  private toRedemption(api: ApiCouponRedemption): CouponRedemption {
    return {
      id: api.id,
      couponId: api.coupon_id,
      userId: api.user_id,
      userName: api.user_name,
      userEmail: api.user_email,
      organizationId: api.organization_id,
      subscriptionId: api.subscription_id,
      stripeCustomerId: api.stripe_customer_id,
      stripeInvoiceId: api.stripe_invoice_id,
      stripeDiscountId: api.stripe_discount_id,
      stripeCheckoutSessionId: api.stripe_checkout_session_id,
      discountAmount: api.discount_amount,
      currency: api.currency,
      affiliateUserId: api.affiliate_user_id,
      affiliateUserName: api.affiliate_user_name,
      affiliateUserEmail: api.affiliate_user_email,
      attributionSource: api.attribution_source,
      redeemedAt: api.redeemed_at,
      paymentSucceededAt: api.payment_succeeded_at,
    };
  }

  private toValidationResult(api: ApiCouponValidationResult): CouponValidationResult {
    return {
      valid: api.valid,
      errorCode: api.error_code,
      errorMessage: api.error_message,
      couponId: api.coupon_id,
      code: api.code,
      discountType: api.discount_type,
      percentOff: api.percent_off,
      amountOff: api.amount_off,
      currency: api.currency,
      duration: api.duration,
      durationInMonths: api.duration_in_months,
    };
  }

  private unwrapPage<TApi, T>(
    page: ApiCursorPaginatedResponse<TApi>,
    mapItem: (x: TApi) => T,
  ): CursorPaginatedResponse<T> {
    return {
      items: (page.items ?? []).map(mapItem),
      nextCursor: page.next_cursor,
      hasMore: page.has_more,
    };
  }

  // --------------------------------------------------------------------------
  // Admin — coupon CRUD
  // --------------------------------------------------------------------------

  async listCoupons(
    limit = 50,
    cursor?: string,
    filters?: CouponListFilters,
  ): Promise<CursorPaginatedResponse<Coupon>> {
    const response = await api.get<ApiResponse<ApiCursorPaginatedResponse<ApiCoupon>>>('/api/admin/coupons', {
      params: {
        limit,
        cursor,
        active: filters?.active,
        affiliateUserId: filters?.affiliateUserId,
        search: filters?.search,
      },
    });
    return this.unwrapPage(response.data.data, (x) => this.toCoupon(x));
  }

  async getCoupon(id: string): Promise<Coupon> {
    const response = await api.get<ApiResponse<ApiCoupon>>(`/api/admin/coupons/${id}`);
    return this.toCoupon(response.data.data);
  }

  async createCoupon(request: CreateCouponRequest): Promise<Coupon> {
    // Transform camelCase → snake_case for the wire.
    const body = {
      code: request.code,
      name: request.name,
      description: request.description ?? null,
      discount_type: request.discountType,
      percent_off: request.percentOff ?? null,
      amount_off_by_currency: request.amountOffByCurrency ?? null,
      duration: request.duration,
      duration_in_months: request.durationInMonths ?? null,
      applies_to_plan_ids: request.appliesToPlanIds ?? null,
      max_redemptions: request.maxRedemptions ?? null,
      max_redemptions_per_user: request.maxRedemptionsPerUser ?? null,
      expires_at: request.expiresAt ?? null,
      affiliate_user_id: request.affiliateUserId ?? null,
      locked_to_user_id: request.lockedToUserId ?? null,
      stripe_livemode: request.stripeLivemode,
    };
    const response = await api.post<ApiResponse<ApiCoupon>>('/api/admin/coupons', body);
    return this.toCoupon(response.data.data);
  }

  async updateCoupon(request: UpdateCouponRequest): Promise<Coupon> {
    const body = {
      id: request.id,
      name: request.name,
      description: request.description,
      applies_to_plan_ids: request.appliesToPlanIds,
      max_redemptions: request.maxRedemptions,
      max_redemptions_per_user: request.maxRedemptionsPerUser,
      expires_at: request.expiresAt,
      affiliate_user_id: request.affiliateUserId,
      locked_to_user_id: request.lockedToUserId,
      active: request.active,
    };
    const response = await api.patch<ApiResponse<ApiCoupon>>(`/api/admin/coupons/${request.id}`, body);
    return this.toCoupon(response.data.data);
  }

  async softDeleteCoupon(id: string): Promise<void> {
    await api.delete(`/api/admin/coupons/${id}`);
  }

  async listRedemptions(
    couponId: string,
    limit = 50,
    cursor?: string,
  ): Promise<CursorPaginatedResponse<CouponRedemption>> {
    const response = await api.get<ApiResponse<ApiCursorPaginatedResponse<ApiCouponRedemption>>>(
      `/api/admin/coupons/${couponId}/redemptions`,
      { params: { limit, cursor } },
    );
    return this.unwrapPage(response.data.data, (x) => this.toRedemption(x));
  }

  async listAffiliateRedemptions(
    userId: string,
    limit = 50,
    cursor?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<CursorPaginatedResponse<CouponRedemption>> {
    const response = await api.get<ApiResponse<ApiCursorPaginatedResponse<ApiCouponRedemption>>>(
      `/api/admin/affiliates/${userId}/redemptions`,
      { params: { limit, cursor, dateFrom, dateTo } },
    );
    return this.unwrapPage(response.data.data, (x) => this.toRedemption(x));
  }

  // --------------------------------------------------------------------------
  // Customer — pre-checkout validation
  // --------------------------------------------------------------------------

  async validateCoupon(request: ValidateCouponRequest): Promise<CouponValidationResult> {
    const body = {
      code: request.code,
      plan_id: request.planId,
      currency: request.currency,
      billing_interval: request.billingInterval,
    };
    const response = await api.post<ApiResponse<ApiCouponValidationResult>>('/api/coupons/validate', body);
    return this.toValidationResult(response.data.data);
  }
}

export const couponService = new CouponService();
