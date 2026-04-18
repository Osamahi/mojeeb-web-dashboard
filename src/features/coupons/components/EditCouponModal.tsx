import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { getErrorMessage } from '@/lib/errors';
import { useUpdateCoupon } from '../hooks/useCoupons';
import { UserPickerField } from './UserPickerField';
import type { Coupon, UpdateCouponRequest } from '../types/coupon.types';

interface EditCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
}

/**
 * SuperAdmin edit form. Only exposes mutable fields — discount shape and duration
 * are intentionally not editable because Stripe does not allow changing them after
 * a coupon is created (deactivate + create new is the workflow for those changes).
 */
export function EditCouponModal({ isOpen, onClose, coupon }: EditCouponModalProps) {
  const { t } = useTranslation();
  const mutation = useUpdateCoupon();
  const [form, setForm] = useState<UpdateCouponRequest>({ id: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (coupon) {
      setForm({
        id: coupon.id,
        name: coupon.name,
        description: coupon.description,
        maxRedemptions: coupon.maxRedemptions,
        maxRedemptionsPerUser: coupon.maxRedemptionsPerUser,
        expiresAt: coupon.expiresAt,
        affiliateUserId: coupon.affiliateUserId,
        lockedToUserId: coupon.lockedToUserId,
        active: coupon.active,
      });
      setError(null);
    }
  }, [coupon]);

  if (!coupon) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync(form);
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => !mutation.isPending && onClose()}
      title={t('coupons.edit.title', 'Edit coupon')}
      subtitle={coupon.code}
      maxWidth="lg"
      isLoading={mutation.isPending}
      closable={!mutation.isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            {t('coupons.field.name', 'Name')}
          </label>
          <input
            value={form.name ?? ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            {t('coupons.field.description', 'Description')}
          </label>
          <textarea
            rows={2}
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('coupons.field.affiliate', 'Affiliate user')}>
            <UserPickerField
              value={form.affiliateUserId}
              onChange={(id) => setForm({ ...form, affiliateUserId: id })}
              placeholder={
                t('coupons.field.affiliate_placeholder', 'Who gets credit for redemptions?') as string
              }
              // When the coupon already has an affiliate, show the resolved user chip
              // (name + email) instead of falling back to the opaque UUID view.
              // The list RPC populates these fields via a LEFT JOIN to users.
              initialUser={
                coupon?.affiliateUserId && coupon?.affiliateUserEmail
                  ? {
                      id: coupon.affiliateUserId,
                      email: coupon.affiliateUserEmail,
                      name: coupon.affiliateUserName,
                      phone: null,
                      currentOrganization: null,
                    }
                  : null
              }
              fallbackLabel={t('coupons.field.affiliate_current', 'Affiliate') as string}
            />
          </Field>
          <Field label={t('coupons.field.locked_to', 'Locked to user')}>
            <UserPickerField
              value={form.lockedToUserId}
              onChange={(id) => setForm({ ...form, lockedToUserId: id })}
              placeholder={
                t('coupons.field.locked_to_placeholder', 'Restrict redemption to one user') as string
              }
              initialUser={
                coupon?.lockedToUserId && coupon?.lockedToUserEmail
                  ? {
                      id: coupon.lockedToUserId,
                      email: coupon.lockedToUserEmail,
                      name: coupon.lockedToUserName,
                      phone: null,
                      currentOrganization: null,
                    }
                  : null
              }
              fallbackLabel={t('coupons.field.locked_to_current', 'Locked user') as string}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active ?? true}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          {t('coupons.field.active', 'Active (customers can redeem)')}
        </label>

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
            {mutation.isPending ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
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
