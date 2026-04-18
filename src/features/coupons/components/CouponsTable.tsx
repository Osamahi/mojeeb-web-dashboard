import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Pencil, Ban, CircleCheck } from 'lucide-react';
import type { Coupon } from '../types/coupon.types';

interface CouponsTableProps {
  coupons: Coupon[];
  onEdit: (coupon: Coupon) => void;
  onDeactivate: (coupon: Coupon) => void;
  onReactivate: (coupon: Coupon) => void;
  onViewRedemptions: (coupon: Coupon) => void;
  isTogglingActive?: boolean;
}

/**
 * Read-only table of coupons with inline actions.
 * Deliberately simple — the goal is functional admin operations, not a data grid.
 *
 * Icon conventions (match /features/addons/components/AddonPlansTableView.tsx):
 *   - Eye          → view redemptions
 *   - Pencil       → edit
 *   - Ban          → deactivate (only shown when active)
 *   - CircleCheck  → reactivate (only shown when inactive)
 */
export const CouponsTable = memo(
  ({ coupons, onEdit, onDeactivate, onReactivate, onViewRedemptions, isTogglingActive }: CouponsTableProps) => {
    const { t } = useTranslation();

    if (coupons.length === 0) {
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          {t('coupons.empty', 'No coupons yet — create one to get started.')}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t('coupons.table.code', 'Code')}</th>
              <th className="px-4 py-3 font-medium">{t('coupons.table.name', 'Name')}</th>
              <th className="px-4 py-3 font-medium">{t('coupons.table.discount', 'Discount')}</th>
              <th className="px-4 py-3 font-medium">{t('coupons.table.duration', 'Duration')}</th>
              <th className="px-4 py-3 font-medium">{t('coupons.table.redemptions', 'Redemptions')}</th>
              <th className="px-4 py-3 font-medium">{t('coupons.table.affiliate', 'Affiliate')}</th>
              <th className="px-4 py-3 font-medium">{t('coupons.table.status', 'Status')}</th>
              <th className="px-4 py-3 font-medium text-right">{t('coupons.table.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-800">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span>{coupon.code}</span>
                    {coupon.stripeLivemode === true ? (
                      <span
                        className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                        title={t('coupons.stripe_mode.production', '💳 Live') as string}
                      >
                        {t('coupons.stripe_mode.live_short', 'Live')}
                      </span>
                    ) : (
                      <span
                        className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                        title={t('coupons.stripe_mode.test', '🧪 Test') as string}
                      >
                        {t('coupons.stripe_mode.test_short', 'Test')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{coupon.name}</td>
                <td className="px-4 py-3">{formatDiscount(coupon)}</td>
                <td className="px-4 py-3">{formatDuration(coupon, t)}</td>
                <td className="px-4 py-3">
                  {coupon.timesRedeemed}
                  {coupon.maxRedemptions != null && ` / ${coupon.maxRedemptions}`}
                </td>
                <td className="px-4 py-3">
                  {coupon.affiliateUserId ? (
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-900">
                        {coupon.affiliateUserName || coupon.affiliateUserEmail || '—'}
                      </div>
                      {coupon.affiliateUserName && coupon.affiliateUserEmail && (
                        <div className="truncate text-xs text-neutral-500">
                          {coupon.affiliateUserEmail}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      coupon.active
                        ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                        : 'rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600'
                    }
                  >
                    {coupon.active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onViewRedemptions(coupon)}
                      title={t('coupons.actions.redemptions', 'View redemptions') as string}
                      aria-label={t('coupons.actions.redemptions', 'View redemptions') as string}
                      className="rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-50 hover:text-neutral-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(coupon)}
                      title={t('common.edit', 'Edit') as string}
                      aria-label={t('common.edit', 'Edit') as string}
                      className="rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-50 hover:text-neutral-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {coupon.active ? (
                      <button
                        type="button"
                        onClick={() => onDeactivate(coupon)}
                        disabled={isTogglingActive}
                        title={t('coupons.actions.deactivate', 'Deactivate') as string}
                        aria-label={t('coupons.actions.deactivate', 'Deactivate') as string}
                        className="rounded-lg p-2 text-neutral-400 transition-all hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onReactivate(coupon)}
                        disabled={isTogglingActive}
                        title={t('coupons.actions.reactivate', 'Reactivate') as string}
                        aria-label={t('coupons.actions.reactivate', 'Reactivate') as string}
                        className="rounded-lg p-2 text-neutral-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CircleCheck className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);
CouponsTable.displayName = 'CouponsTable';

function formatDiscount(coupon: Coupon): string {
  if (coupon.discountType === 'percent') {
    return `${coupon.percentOff ?? 0}%`;
  }
  if (!coupon.amountOffByCurrency) return '—';
  return Object.entries(coupon.amountOffByCurrency)
    .map(([currency, amount]) => `${(amount / 100).toFixed(2)} ${currency}`)
    .join(' / ');
}

function formatDuration(coupon: Coupon, t: (key: string, fallback: string) => string): string {
  if (coupon.duration === 'once') return t('coupons.duration.once', 'First payment');
  if (coupon.duration === 'forever') return t('coupons.duration.forever', 'Forever');
  return `${coupon.durationInMonths ?? '?'} ${t('coupons.duration.months', 'months')}`;
}
