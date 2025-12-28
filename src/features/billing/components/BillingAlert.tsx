import { useTranslation } from 'react-i18next';
import { AlertTriangle, CreditCard, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDaysRemaining } from '../utils/billingHelpers';

export enum BillingAlertType {
  PastDue = 'past_due',
  TrialEnding = 'trial_ending',
  CardExpiring = 'card_expiring',
  CanceledEndingSoon = 'canceled_ending_soon',
}

interface BillingAlertProps {
  type: BillingAlertType;
  /** Date for trial ending or subscription ending */
  date?: string;
  /** Expiry month for card expiring (1-12) */
  expiryMonth?: number;
  /** Expiry year for card expiring */
  expiryYear?: number;
  /** Callback for primary action */
  onAction?: () => void;
}

/**
 * Billing alert component
 *
 * Displays contextual alerts for billing issues:
 * - Past due subscription (payment failed)
 * - Trial ending soon
 * - Card expiring soon
 * - Canceled subscription ending soon
 */
export function BillingAlert({ type, date, expiryMonth, expiryYear, onAction }: BillingAlertProps) {
  const { t } = useTranslation();

  const getAlertConfig = () => {
    switch (type) {
      case BillingAlertType.PastDue:
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800',
          title: t('billing.payment_failed_title'),
          message: t('billing.payment_failed_message'),
          actionLabel: t('billing.update_payment_method'),
        };

      case BillingAlertType.TrialEnding: {
        const daysRemaining = date ? getDaysRemaining(date) : 0;
        return {
          icon: <Clock className="w-5 h-5" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800',
          title: t('billing.trial_ending_title'),
          message: t('billing.trial_ending_message', { days: daysRemaining }),
          actionLabel: t('billing.upgrade_now'),
        };
      }

      case BillingAlertType.CardExpiring: {
        const expiryText =
          expiryMonth && expiryYear
            ? `${expiryMonth.toString().padStart(2, '0')}/${expiryYear}`
            : t('billing.soon');
        return {
          icon: <CreditCard className="w-5 h-5" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800',
          title: t('billing.card_expiring_title'),
          message: t('billing.card_expiring_message', { expiry: expiryText }),
          actionLabel: t('billing.update_card'),
        };
      }

      case BillingAlertType.CanceledEndingSoon: {
        const daysRemaining = date ? getDaysRemaining(date) : 0;
        const endDate = date
          ? new Date(date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : t('billing.soon');
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800',
          title: t('billing.subscription_ending_title'),
          message: t('billing.subscription_ending_message', { date: endDate, days: daysRemaining }),
          actionLabel: t('billing.reactivate'),
        };
      }

      default:
        return null;
    }
  };

  const config = getAlertConfig();

  if (!config) {
    return null;
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 ${config.bgColor} border ${config.borderColor} rounded-lg`}
    >
      <div className={`${config.iconColor} mt-0.5 flex-shrink-0`}>{config.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${config.textColor} mb-1`}>{config.title}</p>
        <p className={`text-sm ${config.textColor}`}>{config.message}</p>
      </div>
      {onAction && (
        <Button size="sm" onClick={onAction} className="flex-shrink-0">
          {config.actionLabel}
        </Button>
      )}
    </div>
  );
}
