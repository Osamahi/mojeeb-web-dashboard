import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useDateLocale } from '@/lib/dateConfig';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import { UserPickerField } from '@/features/coupons/components/UserPickerField';
import { useInfiniteMyRedemptions } from '../hooks/useAffiliate';

/**
 * Self-service page for affiliates — lists every redemption credited to the logged-in user.
 *
 * The backend (`/api/affiliate/my-redemptions`) resolves `affiliate_user_id` from the JWT,
 * so there is no user picker here. A user who isn't an affiliate on any coupon simply
 * sees an empty state.
 */
export default function MyRedemptionsPage() {
  const { t } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();
  const isSuperAdmin = useAuthStore((s) => s.user?.role === Role.SuperAdmin);

  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  // SuperAdmin-only: impersonate another affiliate to test their view. Regular users
  // don't see this control, and the backend silently ignores the override for them.
  const [impersonateAffiliateId, setImpersonateAffiliateId] = useState<string | null>(null);

  const query = useInfiniteMyRedemptions(
    dateFrom || undefined,
    dateTo || undefined,
    isSuperAdmin ? impersonateAffiliateId ?? undefined : undefined,
  );
  const redemptions = query.data?.redemptions ?? [];

  // Summary: cheap client-side aggregation over the loaded pages. Good enough for v1
  // since the affiliate list is bounded and paginated; a dedicated summary endpoint
  // would be premature until volume justifies it.
  const totalRedemptions = redemptions.length;
  const totalDiscountByCurrency = redemptions.reduce<Record<string, number>>((acc, r) => {
    if (r.discountAmount != null && r.currency) {
      acc[r.currency] = (acc[r.currency] ?? 0) + r.discountAmount;
    }
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <BaseHeader
        title={t('affiliate.redemptions.title', 'My Referrals')}
        subtitle={t(
          'affiliate.redemptions.subtitle',
          'People who used your coupon codes.',
        )}
      />

      {/* SuperAdmin testing control: impersonate any affiliate. Hidden from regular users. */}
      {isSuperAdmin && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-800">
            {t('affiliate.redemptions.admin_impersonate_title', 'Admin · view as affiliate')}
          </div>
          <UserPickerField
            value={impersonateAffiliateId}
            onChange={setImpersonateAffiliateId}
            placeholder={
              t('affiliate.redemptions.admin_impersonate_placeholder', 'Search affiliate…') as string
            }
          />
          <p className="mt-2 text-xs text-amber-700">
            {t(
              'affiliate.redemptions.admin_impersonate_hint',
              'Leave empty to see your own redemptions. Regular users never see this control.',
            )}
          </p>
        </div>
      )}

      {/* Summary + filters */}
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
          <div className="md:col-span-2">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              {t('affiliate.redemptions.summary', 'Summary')}
            </div>
            <div className="mt-1 text-sm text-neutral-800">
              {t('affiliate.redemptions.total_count', {
                count: totalRedemptions,
                defaultValue: '{{count}} redemptions',
              })}
              {Object.entries(totalDiscountByCurrency).length > 0 && (
                <>
                  {' · '}
                  {Object.entries(totalDiscountByCurrency).map(([cur, amt], i, arr) => (
                    <span key={cur}>
                      {amt.toFixed(2)} {cur}
                      {i < arr.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  <span className="text-neutral-500">
                    {' '}{t('affiliate.redemptions.total_discount_suffix', 'discount delivered')}
                  </span>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              {t('coupon_redemptions.filter.date_from', 'From')}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              {t('coupon_redemptions.filter.date_to', 'To')}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {query.isLoading ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
            {t('common.loading', 'Loading…')}
          </div>
        ) : redemptions.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
            {t(
              'affiliate.redemptions.empty',
              "No one has used your coupons yet. Share your code to get started.",
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('coupon_redemptions.col.when', 'When')}</th>
                  <th className="px-4 py-3 font-medium">{t('coupon_redemptions.col.user', 'User')}</th>
                  <th className="px-4 py-3 font-medium">{t('coupon_redemptions.col.amount', 'Amount')}</th>
                  <th className="px-4 py-3 font-medium">{t('coupon_redemptions.col.paid', 'Payment')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {formatSmartTimestamp(r.redeemedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm text-neutral-900">
                          {r.userName || r.userEmail || '—'}
                        </div>
                        {r.userName && r.userEmail && (
                          <div className="truncate text-xs text-neutral-500">{r.userEmail}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.discountAmount != null
                        ? `${r.discountAmount} ${r.currency ?? ''}`
                        : t('coupon_redemptions.pending', 'Pending')}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {r.paymentSucceededAt ? formatSmartTimestamp(r.paymentSucceededAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {query.hasNextPage && (
              <div className="border-t border-neutral-200 p-3">
                <button
                  type="button"
                  onClick={() => query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
                >
                  {query.isFetchingNextPage
                    ? t('common.loading', 'Loading…')
                    : t('common.load_more', 'Load more')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
