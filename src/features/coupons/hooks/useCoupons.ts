/**
 * Coupon hooks (admin + customer).
 * All list endpoints use TanStack's useInfiniteQuery with cursor pagination —
 * same pattern as features/leads/hooks/useLeads.ts.
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { isToastHandled } from '@/lib/errors';
import { couponService } from '../services/couponService';
import { couponQueryKeys } from './couponQueryKeys';
import type {
  Coupon,
  CouponListFilters,
  CreateCouponRequest,
  UpdateCouponRequest,
  ValidateCouponRequest,
} from '../types/coupon.types';

// ============================================================================
// Admin — queries
// ============================================================================

export function useInfiniteCoupons(filters?: CouponListFilters) {
  return useInfiniteQuery({
    queryKey: couponQueryKeys.list(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) => couponService.listCoupons(50, pageParam, filters),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
    select: (data) => {
      const last = data.pages[data.pages.length - 1];
      return {
        coupons: data.pages.flatMap((p) => p.items),
        hasMore: last?.hasMore ?? false,
        nextCursor: last?.nextCursor ?? null,
      };
    },
  });
}

export function useCoupon(couponId: string | undefined) {
  return useQuery({
    queryKey: couponQueryKeys.detail(couponId),
    queryFn: () => couponService.getCoupon(couponId!),
    enabled: !!couponId,
  });
}

export function useInfiniteCouponRedemptions(couponId: string | undefined) {
  return useInfiniteQuery({
    queryKey: couponQueryKeys.redemptions(couponId),
    queryFn: ({ pageParam }) => couponService.listRedemptions(couponId!, 50, pageParam),
    enabled: !!couponId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
    select: (data) => {
      const last = data.pages[data.pages.length - 1];
      return {
        redemptions: data.pages.flatMap((p) => p.items),
        hasMore: last?.hasMore ?? false,
        nextCursor: last?.nextCursor ?? null,
      };
    },
  });
}

export function useInfiniteAffiliateRedemptions(
  userId: string | undefined,
  dateFrom?: string,
  dateTo?: string,
) {
  return useInfiniteQuery({
    queryKey: couponQueryKeys.affiliateRedemptions(userId, dateFrom, dateTo),
    queryFn: ({ pageParam }) =>
      couponService.listAffiliateRedemptions(userId!, 50, pageParam, dateFrom, dateTo),
    enabled: !!userId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
    select: (data) => {
      const last = data.pages[data.pages.length - 1];
      return {
        redemptions: data.pages.flatMap((p) => p.items),
        hasMore: last?.hasMore ?? false,
        nextCursor: last?.nextCursor ?? null,
      };
    },
  });
}

// ============================================================================
// Admin — mutations
// ============================================================================

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (request: CreateCouponRequest) => couponService.createCoupon(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponQueryKeys.lists() });
      toast.success(t('coupons.toast.created', 'Coupon created'));
    },
    onError: (error) => {
      if (!isToastHandled(error))
        toast.error(t('coupons.toast.create_failed', 'Failed to create coupon'));
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (request: UpdateCouponRequest) => couponService.updateCoupon(request),
    onSuccess: (updated: Coupon) => {
      queryClient.invalidateQueries({ queryKey: couponQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: couponQueryKeys.detail(updated.id) });
      toast.success(t('coupons.toast.updated', 'Coupon updated'));
    },
    onError: (error) => {
      if (!isToastHandled(error))
        toast.error(t('coupons.toast.update_failed', 'Failed to update coupon'));
    },
  });
}

export function useSoftDeleteCoupon() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => couponService.softDeleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponQueryKeys.lists() });
      toast.success(t('coupons.toast.deactivated', 'Coupon deactivated'));
    },
    onError: (error) => {
      if (!isToastHandled(error))
        toast.error(t('coupons.toast.deactivate_failed', 'Failed to deactivate coupon'));
    },
  });
}

// ============================================================================
// Customer — validation (called from PlanChangeWizard onBlur)
// ============================================================================

export function useValidateCoupon() {
  return useMutation({
    mutationFn: (request: ValidateCouponRequest) => couponService.validateCoupon(request),
    // We intentionally do NOT show a toast on error here — the checkout UI renders
    // the validation state inline next to the coupon input. Network errors still
    // surface via the global Axios interceptor.
  });
}
