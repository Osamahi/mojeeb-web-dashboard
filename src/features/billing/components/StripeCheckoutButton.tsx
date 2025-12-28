import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { useCreateCheckoutMutation } from '../hooks/useCreateCheckoutMutation';
import type { BillingCurrency, BillingInterval } from '../types/billing.types';

interface StripeCheckoutButtonProps {
  planId: string;
  currency: BillingCurrency;
  billingInterval: BillingInterval;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable Stripe checkout button
 *
 * Creates a checkout session and redirects to Stripe-hosted checkout.
 * Handles loading state and error messages automatically.
 *
 * @example
 * ```tsx
 * <StripeCheckoutButton
 *   planId="plan-uuid"
 *   currency={BillingCurrency.USD}
 *   billingInterval={BillingInterval.Monthly}
 *   label="Upgrade to Pro"
 * />
 * ```
 */
export function StripeCheckoutButton({
  planId,
  currency,
  billingInterval,
  label = 'Checkout',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
}: StripeCheckoutButtonProps) {
  const { t } = useTranslation();
  const mutation = useCreateCheckoutMutation({
    autoRedirect: true,
  });

  const handleClick = () => {
    mutation.mutate({
      planId,
      currency,
      billingInterval,
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || mutation.isPending}
      className={className}
    >
      {mutation.isPending ? t('billing.redirecting') : label}
    </Button>
  );
}
