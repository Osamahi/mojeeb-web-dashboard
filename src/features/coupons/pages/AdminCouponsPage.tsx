import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useConfirm } from '@/hooks/useConfirm';
import { useInfiniteCoupons, useSoftDeleteCoupon, useUpdateCoupon } from '../hooks/useCoupons';
import type { Coupon, CouponListFilters } from '../types/coupon.types';
import { CouponsTable } from '../components/CouponsTable';
import { CreateCouponModal } from '../components/CreateCouponModal';
import { EditCouponModal } from '../components/EditCouponModal';
import { CouponRedemptionsModal } from '../components/CouponRedemptionsModal';

/**
 * SuperAdmin-only page (wrapped by SuperAdminRoute in router.tsx).
 */
export default function AdminCouponsPage() {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<CouponListFilters>({});
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [viewingRedemptions, setViewingRedemptions] = useState<Coupon | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteCoupons(filters);
  const softDelete = useSoftDeleteCoupon();
  const updateCoupon = useUpdateCoupon();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const coupons = data?.coupons ?? [];

  const handleDeactivate = useCallback(
    async (coupon: Coupon) => {
      const ok = await confirm({
        title: t('coupons.confirm.deactivate_title', 'Deactivate coupon?') as string,
        message: t(
          'coupons.confirm.deactivate',
          'Deactivate coupon "{{code}}"? Customers will no longer be able to redeem it. The historical ledger is preserved.',
          { code: coupon.code },
        ) as string,
        confirmText: t('coupons.actions.deactivate', 'Deactivate') as string,
        variant: 'danger',
      });
      if (ok) {
        softDelete.mutate(coupon.id);
      }
    },
    [confirm, softDelete, t],
  );

  const handleReactivate = useCallback(
    async (coupon: Coupon) => {
      const ok = await confirm({
        title: t('coupons.confirm.reactivate_title', 'Reactivate coupon?') as string,
        message: t(
          'coupons.confirm.reactivate',
          'Reactivate coupon "{{code}}"? Customers will be able to redeem it again.',
          { code: coupon.code },
        ) as string,
        confirmText: t('coupons.actions.reactivate', 'Reactivate') as string,
        variant: 'info',
      });
      if (ok) {
        updateCoupon.mutate({ id: coupon.id, active: true });
      }
    },
    [confirm, updateCoupon, t],
  );

  const handleOpenCreate = useCallback(() => setCreateOpen(true), []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <BaseHeader
        title={t('coupons.title', 'Coupons')}
        subtitle={t(
          'coupons.subtitle',
          'Create and manage Stripe-backed coupons. Link codes to affiliates to track redemptions.',
        )}
        primaryAction={{
          label: t('coupons.create.button', 'Create'),
          icon: Plus,
          onClick: handleOpenCreate,
        }}
      />

      {/* Filters */}
      <div className="mb-4 mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={filters.search ?? ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
          placeholder={t('coupons.filter.search_placeholder', 'Search by code or name…')}
          className="min-w-[240px] rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={filters.active === true}
            onChange={(e) =>
              setFilters({ ...filters, active: e.target.checked ? true : undefined })
            }
          />
          {t('coupons.filter.active_only', 'Active only')}
        </label>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          {t('common.loading', 'Loading…')}
        </div>
      ) : (
        <>
          <CouponsTable
            coupons={coupons}
            onEdit={setEditing}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onViewRedemptions={setViewingRedemptions}
            isTogglingActive={softDelete.isPending || updateCoupon.isPending}
          />

          {hasNextPage && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
              >
                {isFetchingNextPage
                  ? t('common.loading', 'Loading…')
                  : t('common.load_more', 'Load more')}
              </button>
            </div>
          )}
        </>
      )}

      <CreateCouponModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
      <EditCouponModal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        coupon={editing}
      />
      <CouponRedemptionsModal
        isOpen={viewingRedemptions !== null}
        onClose={() => setViewingRedemptions(null)}
        coupon={viewingRedemptions}
      />
      {ConfirmDialogComponent}
    </div>
  );
}
