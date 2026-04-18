import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { getErrorMessage } from '@/lib/errors';
import { useCreateCoupon } from '../hooks/useCoupons';
import { UserPickerField } from './UserPickerField';
import type { CouponDiscountType, CouponDuration, CreateCouponRequest } from '../types/coupon.types';

interface CreateCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_CURRENCIES = ['USD', 'EGP', 'SAR'] as const;

/**
 * SuperAdmin form for creating a coupon. Minimal-but-complete:
 *   - required: code, name, discount type + value, duration
 *   - optional: per-currency amount (if discount type is amount), plan scope, caps,
 *     expires_at, affiliate linkage, locked_to_user_id
 *
 * Server-side validation is authoritative (DB CHECK + domain validator); this form
 * just catches the obvious input errors to keep the UX snappy.
 */
export function CreateCouponModal({ isOpen, onClose }: CreateCouponModalProps) {
  const { t } = useTranslation();
  const mutation = useCreateCoupon();

  const [form, setForm] = useState<CreateCouponRequest>({
    code: '',
    name: '',
    discountType: 'percent',
    percentOff: 10,
    duration: 'once',
    // Default to Production — new coupons are assumed to be real revenue-affecting
    // discounts; an admin can flip to Test for sandbox experiments.
    stripeLivemode: true,
  });
  const [amounts, setAmounts] = useState<Record<string, string>>({ USD: '', EGP: '', SAR: '' });
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setForm({
      code: '',
      name: '',
      discountType: 'percent',
      percentOff: 10,
      duration: 'once',
      stripeLivemode: true,
    });
    setAmounts({ USD: '', EGP: '', SAR: '' });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: CreateCouponRequest = { ...form };

    if (payload.discountType === 'amount') {
      const map: Record<string, number> = {};
      for (const c of SUPPORTED_CURRENCIES) {
        const raw = amounts[c]?.trim();
        if (raw) {
          const parsed = Math.round(parseFloat(raw) * 100);
          if (!isFinite(parsed) || parsed <= 0) {
            setError(t('coupons.error.invalid_amount', 'Amounts must be positive numbers.'));
            return;
          }
          map[c] = parsed;
        }
      }
      if (Object.keys(map).length === 0) {
        setError(
          t('coupons.error.amount_required', 'Enter at least one currency amount for fixed-amount coupons.'),
        );
        return;
      }
      payload.amountOffByCurrency = map;
      payload.percentOff = null;
    } else {
      payload.amountOffByCurrency = null;
    }

    if (payload.duration !== 'repeating') payload.durationInMonths = null;

    try {
      await mutation.mutateAsync(payload);
      reset();
      onClose();
    } catch (err: unknown) {
      // getErrorMessage unwraps axios error → response.data.message (the backend's
      // human-readable reason: "A coupon with code 'TEST10' already exists." etc.)
      setError(getErrorMessage(err));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        if (!mutation.isPending) {
          reset();
          onClose();
        }
      }}
      title={t('coupons.create.title', 'Create coupon')}
      subtitle={t('coupons.create.subtitle', 'Create a new Stripe-backed coupon with optional affiliate credit.')}
      maxWidth="xl"
      isLoading={mutation.isPending}
      closable={!mutation.isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Stripe environment — pinned for the coupon's lifetime. Stripe does not allow
            migration between Test and Live, so this must be set correctly at create time. */}
        <Field label={t('coupons.field.stripe_livemode', 'Stripe environment') + ' *'}>
          <div
            className="inline-flex rounded-md border border-neutral-300 p-0.5"
            role="radiogroup"
            aria-label={t('coupons.field.stripe_livemode', 'Stripe environment') as string}
          >
            <button
              type="button"
              role="radio"
              aria-checked={!form.stripeLivemode}
              onClick={() => setForm({ ...form, stripeLivemode: false })}
              className={
                'rounded px-4 py-1.5 text-sm font-medium transition ' +
                (!form.stripeLivemode
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100')
              }
            >
              {t('coupons.stripe_mode.test', '🧪 Test')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={form.stripeLivemode}
              onClick={() => setForm({ ...form, stripeLivemode: true })}
              className={
                'rounded px-4 py-1.5 text-sm font-medium transition ' +
                (form.stripeLivemode
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100')
              }
            >
              {t('coupons.stripe_mode.production', '💳 Live')}
            </button>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {t(
              'coupons.field.stripe_livemode_hint',
              'Pinned for the coupon\u2019s lifetime. Stripe does not allow moving a coupon between Test and Live.',
            )}
          </p>
        </Field>

        {/* Code + name */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('coupons.field.code', 'Code') + ' *'}>
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.trim() })}
              placeholder="LAUNCH50"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label={t('coupons.field.name', 'Name') + ' *'}>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>

        {/* Discount type + value */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('coupons.field.discount_type', 'Discount type') + ' *'}>
            <select
              value={form.discountType}
              onChange={(e) =>
                setForm({ ...form, discountType: e.target.value as CouponDiscountType })
              }
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="percent">{t('coupons.discount.percent', 'Percent off')}</option>
              <option value="amount">{t('coupons.discount.amount', 'Fixed amount')}</option>
            </select>
          </Field>
          {form.discountType === 'percent' ? (
            <Field label={t('coupons.field.percent_off', 'Percent off') + ' *'}>
              <input
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                required
                value={form.percentOff ?? ''}
                onChange={(e) => setForm({ ...form, percentOff: parseFloat(e.target.value) })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </Field>
          ) : (
            <div />
          )}
        </div>

        {/* Per-currency amounts (only when amount) */}
        {form.discountType === 'amount' && (
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              {t('coupons.field.amounts', 'Amounts per currency')}
            </label>
            <p className="mb-2 text-xs text-neutral-500">
              {t(
                'coupons.field.amounts_hint',
                'Enter the discount in the major unit (e.g. "5.00" for $5). Leave blank to skip a currency.',
              )}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {SUPPORTED_CURRENCIES.map((c) => (
                <div key={c}>
                  <label className="block text-xs text-neutral-500">{c}</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={amounts[c]}
                    onChange={(e) => setAmounts({ ...amounts, [c]: e.target.value })}
                    className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('coupons.field.duration', 'Duration') + ' *'}>
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value as CouponDuration })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="once">{t('coupons.duration.once', 'First payment only')}</option>
              <option value="repeating">{t('coupons.duration.repeating', 'N months')}</option>
              <option value="forever">{t('coupons.duration.forever', 'Forever')}</option>
            </select>
          </Field>
          {form.duration === 'repeating' && (
            <Field label={t('coupons.field.duration_months', 'Months') + ' *'}>
              <input
                type="number"
                min={1}
                max={36}
                required
                value={form.durationInMonths ?? ''}
                onChange={(e) => setForm({ ...form, durationInMonths: parseInt(e.target.value, 10) })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </Field>
          )}
        </div>

        {/* Caps + expiry */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={t('coupons.field.max_total', 'Max total redemptions')}>
            <input
              type="number"
              min={1}
              value={form.maxRedemptions ?? ''}
              onChange={(e) =>
                setForm({ ...form, maxRedemptions: e.target.value ? parseInt(e.target.value, 10) : null })
              }
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label={t('coupons.field.max_per_user', 'Max per user')}>
            <input
              type="number"
              min={1}
              value={form.maxRedemptionsPerUser ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxRedemptionsPerUser: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label={t('coupons.field.expires_at', 'Expires at')}>
            <input
              type="datetime-local"
              value={form.expiresAt ?? ''}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value || null })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>

        {/* Affiliate + lock-to-user — searchable user pickers (name / email / phone) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('coupons.field.affiliate', 'Affiliate user')}>
            <UserPickerField
              value={form.affiliateUserId}
              onChange={(id) => setForm({ ...form, affiliateUserId: id })}
              placeholder={t('coupons.field.affiliate_placeholder', 'Who gets credit for redemptions?') as string}
            />
          </Field>
          <Field label={t('coupons.field.locked_to', 'Locked to user')}>
            <UserPickerField
              value={form.lockedToUserId}
              onChange={(id) => setForm({ ...form, lockedToUserId: id })}
              placeholder={t('coupons.field.locked_to_placeholder', 'Restrict redemption to one user') as string}
            />
          </Field>
        </div>

        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {mutation.isPending ? t('common.saving', 'Saving…') : t('coupons.create.submit', 'Create coupon')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>
      {children}
    </div>
  );
}
