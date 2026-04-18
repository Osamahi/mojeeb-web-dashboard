import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { useInfiniteCouponRedemptions } from '../hooks/useCoupons';
import type { Coupon } from '../types/coupon.types';

interface CouponRedemptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
}

/**
 * Per-coupon redemption ledger. Simple list view — affiliate payout is phase 2.
 */
export function CouponRedemptionsModal({ isOpen, onClose, coupon }: CouponRedemptionsModalProps) {
  const { t } = useTranslation();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteCouponRedemptions(coupon?.id);

  if (!coupon) return null;

  const redemptions = data?.redemptions ?? [];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('coupons.redemptions.title', 'Redemptions')}
      subtitle={`${coupon.code} — ${coupon.timesRedeemed} ${t('coupons.redemptions.total', 'total redemptions')}`}
      maxWidth="2xl"
    >
      {isLoading ? (
        <div className="py-8 text-center text-sm text-neutral-500">{t('common.loading', 'Loading…')}</div>
      ) : redemptions.length === 0 ? (
        <div className="py-8 text-center text-sm text-neutral-500">
          {t('coupons.redemptions.empty', 'No redemptions yet.')}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-md border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('coupons.redemptions.when', 'When')}</th>
                  <th className="px-3 py-2 font-medium">{t('coupons.redemptions.user', 'User')}</th>
                  <th className="px-3 py-2 font-medium">{t('coupons.redemptions.amount', 'Amount')}</th>
                  <th className="px-3 py-2 font-medium">{t('coupons.redemptions.invoice', 'Invoice')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {redemptions.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 text-xs text-neutral-500">
                      {new Date(r.redeemedAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm text-neutral-900">
                          {r.userName || r.userEmail || r.userId.slice(0, 8) + '…'}
                        </div>
                        {r.userName && r.userEmail && (
                          <div className="truncate text-xs text-neutral-500">{r.userEmail}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {r.discountAmount != null
                        ? `${r.discountAmount} ${r.currency ?? ''}`
                        : t('coupons.redemptions.pending', 'Pending')}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-neutral-500">
                      {r.stripeInvoiceId ? r.stripeInvoiceId.slice(0, 14) + '…' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasNextPage && (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              {isFetchingNextPage
                ? t('common.loading', 'Loading…')
                : t('common.load_more', 'Load more')}
            </button>
          )}
        </div>
      )}
    </BaseModal>
  );
}
