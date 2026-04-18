/**
 * Coupon feature query keys.
 * Kept local to the feature so we don't perturb the global queryKeys factory.
 */
export const couponQueryKeys = {
  all: ['coupons'] as const,
  lists: () => [...couponQueryKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...couponQueryKeys.lists(), filters ?? {}] as const,
  detail: (id: string | undefined) => [...couponQueryKeys.all, 'detail', id] as const,
  redemptions: (couponId: string | undefined) => [...couponQueryKeys.all, 'redemptions', couponId] as const,
  affiliateRedemptions: (userId: string | undefined, dateFrom?: string, dateTo?: string) =>
    [...couponQueryKeys.all, 'affiliate-redemptions', userId, dateFrom, dateTo] as const,
  validation: (code: string, planId: string, currency: string, billingInterval: string) =>
    [...couponQueryKeys.all, 'validation', code, planId, currency, billingInterval] as const,
};
