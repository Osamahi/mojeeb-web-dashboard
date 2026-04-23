/**
 * Affiliate self-service API adapter.
 *
 * Reuses the shared `CursorPaginatedResponse<T>` envelope from the coupons feature —
 * same backend shape, no reason to duplicate.
 */

import api from '@/lib/api';
import type {
  ApiCursorPaginatedResponse,
  CursorPaginatedResponse,
} from '@/features/coupons/types/coupon.types';
import type {
  AffiliateRedemption,
  ApiAffiliateRedemption,
  ApiAffiliateStatus,
} from '../types/affiliate.types';

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

class AffiliateService {
  private toRedemption(r: ApiAffiliateRedemption): AffiliateRedemption {
    return {
      id: r.id,
      couponId: r.coupon_id,
      userName: r.user_name,
      userEmail: r.user_email,
      discountAmount: r.discount_amount,
      currency: r.currency,
      redeemedAt: r.redeemed_at,
      paymentSucceededAt: r.payment_succeeded_at,
    };
  }

  async getStatus(): Promise<boolean> {
    const response = await api.get<ApiResponse<ApiAffiliateStatus>>('/api/affiliate/status');
    return response.data.data.is_affiliate;
  }

  async listMyRedemptions(
    limit = 50,
    cursor?: string,
    dateFrom?: string,
    dateTo?: string,
    /**
     * SuperAdmin override: impersonate any affiliate for testing. Regular users
     * passing this are silently ignored by the backend, which falls back to self.
     */
    affiliateUserId?: string,
  ): Promise<CursorPaginatedResponse<AffiliateRedemption>> {
    const response = await api.get<ApiResponse<ApiCursorPaginatedResponse<ApiAffiliateRedemption>>>(
      '/api/affiliate/my-redemptions',
      { params: { limit, cursor, dateFrom, dateTo, affiliateUserId } },
    );
    const page = response.data.data;
    return {
      items: (page.items ?? []).map((x) => this.toRedemption(x)),
      nextCursor: page.next_cursor,
      hasMore: page.has_more,
    };
  }
}

export const affiliateService = new AffiliateService();
