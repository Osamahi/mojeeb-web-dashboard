import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { UserPickerField } from '../components/UserPickerField';
import {
  useInfiniteAffiliateRedemptions,
  useInfiniteCouponRedemptions,
  useInfiniteCoupons,
} from '../hooks/useCoupons';
import type { CouponRedemption } from '../types/coupon.types';

/**
 * SuperAdmin-only page — cross-coupon redemption ledger.
 *
 * Two orthogonal filters (pick one):
 *   A. Filter by coupon → uses get_coupon_redemptions_cursor
 *   B. Filter by affiliate user → uses get_affiliate_redemptions_cursor
 *
 * Most payout/audit workflows want "show me redemptions for affiliate X in date range",
 * so the affiliate path is the default. When neither is set we show a helper prompt —
 * the backend does not expose a global "all redemptions" endpoint and we don't need one
 * for v1 (volume is low; scope narrows the query plan).
 */
export default function AdminCouponRedemptionsPage() {
  const { t } = useTranslation();

  const [affiliateUserId, setAffiliateUserId] = useState<string | null>(null);
  const [couponId, setCouponId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Coupon selector populated via the standard infinite list.
  const couponsQuery = useInfiniteCoupons();
  const coupons = couponsQuery.data?.coupons ?? [];

  // Per-affiliate query (default path)
  const affiliateQuery = useInfiniteAffiliateRedemptions(
    affiliateUserId ?? undefined,
    dateFrom || undefined,
    dateTo || undefined,
  );

  // Per-coupon query (alternate filter)
  const couponLedgerQuery = useInfiniteCouponRedemptions(couponId || undefined);

  // Which dataset drives the table?
  const active = affiliateUserId ? 'affiliate' : couponId ? 'coupon' : 'none';
  const redemptions: CouponRedemption[] = useMemo(() => {
    if (active === 'affiliate') return affiliateQuery.data?.redemptions ?? [];
    if (active === 'coupon') return couponLedgerQuery.data?.redemptions ?? [];
    return [];
  }, [active, affiliateQuery.data, couponLedgerQuery.data]);

  const isLoading =
    active === 'affiliate'
      ? affiliateQuery.isLoading
      : active === 'coupon'
      ? couponLedgerQuery.isLoading
      : false;

  const hasNextPage =
    active === 'affiliate'
      ? affiliateQuery.hasNextPage
      : active === 'coupon'
      ? couponLedgerQuery.hasNextPage
      : false;

  const isFetchingNextPage =
    active === 'affiliate'
      ? affiliateQuery.isFetchingNextPage
      : active === 'coupon'
      ? couponLedgerQuery.isFetchingNextPage
      : false;

  const fetchNextPage = () => {
    if (active === 'affiliate') affiliateQuery.fetchNextPage();
    if (active === 'coupon') couponLedgerQuery.fetchNextPage();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <BaseHeader
        title={t('coupon_redemptions.title', 'Coupon Redemptions')}
        subtitle={t(
          'coupon_redemptions.subtitle',
          'Audit who redeemed which coupon — used for affiliate payouts and fraud review.',
        )}
      />

      {/* Filters */}
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              {t('coupon_redemptions.filter.affiliate', 'Filter by affiliate')}
            </label>
            <UserPickerField
              value={affiliateUserId}
              onChange={(id) => {
                setAffiliateUserId(id);
                if (id) setCouponId('');
              }}
              placeholder={
                t('coupon_redemptions.filter.affiliate_placeholder', 'Search user by name, email, or phone…') as string
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              {t('coupon_redemptions.filter.coupon', 'Or filter by coupon')}
            </label>
            <select
              value={couponId}
              onChange={(e) => {
                setCouponId(e.target.value);
                if (e.target.value) setAffiliateUserId(null);
              }}
              disabled={!!affiliateUserId}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">{t('coupon_redemptions.filter.any_coupon', 'Any coupon')}</option>
              {coupons.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              {t('coupon_redemptions.filter.date_from', 'From')}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={active !== 'affiliate'}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50"
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
              disabled={active !== 'affiliate'}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>
        </div>
        {active === 'coupon' && (
          <p className="mt-3 text-xs text-neutral-500">
            {t(
              'coupon_redemptions.filter.date_disabled_hint',
              'Date range only applies when filtering by affiliate.',
            )}
          </p>
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {active === 'none' ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
            {t(
              'coupon_redemptions.empty_filters',
              'Pick an affiliate or coupon above to load redemptions.',
            )}
          </div>
        ) : isLoading ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
            {t('common.loading', 'Loading…')}
          </div>
        ) : redemptions.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
            {t('coupon_redemptions.empty_results', 'No redemptions match the current filters.')}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('coupon_redemptions.col.when', 'When')}</th>
                  <th className="px-4 py-3 font-medium">{t('coupon_redemptions.col.coupon', 'Coupon')}</th>
                  <th className="px-4 py-3 font-medium">{t('coupon_redemptions.col.user', 'User')}</th>
                  <th className="px-4 py-3 font-medium">{t('coupon_redemptions.col.amount', 'Amount')}</th>
                  <th className="px-4 py-3 font-medium">{t('coupon_redemptions.col.paid', 'Payment')}</th>
                  <th className="px-4 py-3 font-medium">{t('coupon_redemptions.col.invoice', 'Invoice')}</th>
                  <th className="px-4 py-3 font-medium">{t('coupon_redemptions.col.source', 'Source')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {redemptions.map((r) => {
                  const coupon = coupons.find((c) => c.id === r.couponId);
                  return (
                    <tr key={r.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {new Date(r.redeemedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {coupon ? coupon.code : r.couponId.slice(0, 8) + '…'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm text-neutral-900">
                            {r.userName || r.userEmail || r.userId.slice(0, 8) + '…'}
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
                        {r.paymentSucceededAt
                          ? new Date(r.paymentSucceededAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                        {r.stripeInvoiceId ? r.stripeInvoiceId.slice(0, 14) + '…' : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{r.attributionSource}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {hasNextPage && (
              <div className="border-t border-neutral-200 p-3">
                <button
                  type="button"
                  onClick={fetchNextPage}
                  disabled={isFetchingNextPage}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
                >
                  {isFetchingNextPage
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
