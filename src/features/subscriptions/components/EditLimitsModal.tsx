/**
 * Edit Subscription Limits Modal
 * Allows SuperAdmin to manually adjust message and agent limits for the current billing period
 * Also allows overriding the billing period start/end dates (updates both subscriptions and usage records tables)
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionDetails } from '../types/subscription.types';

interface EditLimitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  subscription: SubscriptionDetails;
}

/**
 * Convert an ISO date string to YYYY-MM-DD format for date input
 */
function toDateInputValue(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a YYYY-MM-DD date input value to an ISO UTC string
 */
function toUtcIsoString(dateInputValue: string): string {
  return `${dateInputValue}T00:00:00Z`;
}

export function EditLimitsModal({
  isOpen,
  onClose,
  onSuccess,
  subscription,
}: EditLimitsModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [messageLimit, setMessageLimit] = useState<string>(subscription.messageLimit.toString());
  const [agentLimit, setAgentLimit] = useState<string>(subscription.agentLimit.toString());
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');

  // Store original date values for change detection
  const originalPeriodStart = toDateInputValue(subscription.currentPeriodStart);
  const originalPeriodEnd = toDateInputValue(subscription.currentPeriodEnd);

  // Reset form when modal opens or subscription changes
  useEffect(() => {
    if (isOpen) {
      setMessageLimit(subscription.messageLimit.toString());
      setAgentLimit(subscription.agentLimit.toString());
      setPeriodStart(originalPeriodStart);
      setPeriodEnd(originalPeriodEnd);
    }
  }, [isOpen, subscription]);

  // Check if anything changed
  const hasChanges =
    messageLimit !== subscription.messageLimit.toString() ||
    agentLimit !== subscription.agentLimit.toString() ||
    periodStart !== originalPeriodStart ||
    periodEnd !== originalPeriodEnd;

  // Mutation for updating limits
  const updateLimitsMutation = useMutation({
    mutationFn: () => {
      const messageLimitValue = messageLimit === '' ? null : parseInt(messageLimit, 10);
      const agentLimitValue = agentLimit === '' ? null : parseInt(agentLimit, 10);

      // Only send period dates if they changed
      const periodStartValue = periodStart !== originalPeriodStart ? toUtcIsoString(periodStart) : null;
      const periodEndValue = periodEnd !== originalPeriodEnd ? toUtcIsoString(periodEnd) : null;

      return subscriptionService.adminUpdateLimits(
        subscription.id,
        messageLimitValue,
        agentLimitValue,
        periodStartValue,
        periodEndValue
      );
    },
    onSuccess: () => {
      toast.success(t('edit_limits.success', 'Subscription limits updated successfully'));
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', subscription.id] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to update limits:', error);
      toast.error(
        t(
          'edit_limits.error',
          error.response?.data?.message || 'Failed to update subscription limits'
        )
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      toast.info(t('edit_limits.no_changes', 'No changes made'));
      return;
    }

    // Validate inputs
    const messageLimitNum = parseInt(messageLimit, 10);
    const agentLimitNum = parseInt(agentLimit, 10);

    if (messageLimit !== '' && (isNaN(messageLimitNum) || messageLimitNum < 0)) {
      toast.error(t('edit_limits.invalid_message_limit', 'Message limit must be 0 or greater'));
      return;
    }

    if (agentLimit !== '' && (isNaN(agentLimitNum) || agentLimitNum < 0)) {
      toast.error(t('edit_limits.invalid_agent_limit', 'Agent limit must be 0 or greater'));
      return;
    }

    // Validate dates
    if (periodStart && periodEnd && new Date(periodStart) >= new Date(periodEnd)) {
      toast.error(t('edit_limits.invalid_dates', 'Period start must be before period end'));
      return;
    }

    updateLimitsMutation.mutate();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('edit_limits.title', 'Edit Subscription Limits')}
      subtitle={t(
        'edit_limits.subtitle',
        'Adjust limits and billing period dates'
      )}
      maxWidth="md"
      isLoading={updateLimitsMutation.isPending}
      closable={!updateLimitsMutation.isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Plan Info */}
        <div className="rounded-lg bg-neutral-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-neutral-700">
            {t('edit_limits.current_subscription', 'Current Subscription')}
          </h3>
          <div className="space-y-1 text-sm text-neutral-600">
            <p>
              <span className="font-medium">
                {t('edit_limits.organization', 'Organization')}:
              </span>{' '}
              {subscription.organizationName}
            </p>
            <p>
              <span className="font-medium">{t('edit_limits.plan', 'Plan')}:</span>{' '}
              {subscription.planName} ({subscription.planCode})
            </p>
            <p>
              <span className="font-medium">{t('edit_limits.status', 'Status')}:</span>{' '}
              {subscription.status}
            </p>
          </div>
        </div>

        {/* Edit Limits Section */}
        <div className="space-y-4">
          {/* Message Limit */}
          <div>
            <label htmlFor="messageLimit" className="block text-sm font-medium text-neutral-700">
              {t('edit_limits.message_limit', 'Message Limit')}
            </label>
            <input
              type="number"
              id="messageLimit"
              value={messageLimit}
              onChange={(e) => setMessageLimit(e.target.value)}
              min="0"
              step="1"
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder={t('edit_limits.message_limit_placeholder', 'Enter message limit (0 = unlimited)')}
              disabled={updateLimitsMutation.isPending}
            />
            <p className="mt-1 text-xs text-neutral-500">
              {t('edit_limits.message_limit_help', 'Current limit: {limit}', {
                limit: subscription.messageLimit === 0 ? 'Unlimited' : subscription.messageLimit,
              })}
            </p>
          </div>

          {/* Agent Limit */}
          <div>
            <label htmlFor="agentLimit" className="block text-sm font-medium text-neutral-700">
              {t('edit_limits.agent_limit', 'Agent Limit')}
            </label>
            <input
              type="number"
              id="agentLimit"
              value={agentLimit}
              onChange={(e) => setAgentLimit(e.target.value)}
              min="0"
              step="1"
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder={t('edit_limits.agent_limit_placeholder', 'Enter agent limit (0 = unlimited)')}
              disabled={updateLimitsMutation.isPending}
            />
            <p className="mt-1 text-xs text-neutral-500">
              {t('edit_limits.agent_limit_help', 'Current limit: {limit}', {
                limit: subscription.agentLimit === 0 ? 'Unlimited' : subscription.agentLimit,
              })}
            </p>
          </div>
        </div>

        {/* Billing Period Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-700">
            {t('edit_limits.billing_period', 'Billing Period')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Period Start */}
            <div>
              <label htmlFor="periodStart" className="block text-sm font-medium text-neutral-700">
                {t('edit_limits.period_start', 'Start Date')}
              </label>
              <input
                type="date"
                id="periodStart"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                disabled={updateLimitsMutation.isPending}
              />
            </div>

            {/* Period End */}
            <div>
              <label htmlFor="periodEnd" className="block text-sm font-medium text-neutral-700">
                {t('edit_limits.period_end', 'End Date')}
              </label>
              <input
                type="date"
                id="periodEnd"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                disabled={updateLimitsMutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Preview Changes */}
        {hasChanges && (
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
            <h3 className="mb-2 text-sm font-medium text-green-900">
              {t('edit_limits.preview', 'Preview Changes')}
            </h3>
            <div className="space-y-1 text-sm text-green-800">
              {messageLimit !== subscription.messageLimit.toString() && (
                <p>
                  {t('edit_limits.message_change', 'Message Limit: {old} → {new}', {
                    old: subscription.messageLimit === 0 ? 'Unlimited' : subscription.messageLimit,
                    new: messageLimit === '' || parseInt(messageLimit) === 0 ? 'Unlimited' : messageLimit,
                  })}
                </p>
              )}
              {agentLimit !== subscription.agentLimit.toString() && (
                <p>
                  {t('edit_limits.agent_change', 'Agent Limit: {old} → {new}', {
                    old: subscription.agentLimit === 0 ? 'Unlimited' : subscription.agentLimit,
                    new: agentLimit === '' || parseInt(agentLimit) === 0 ? 'Unlimited' : agentLimit,
                  })}
                </p>
              )}
              {periodStart !== originalPeriodStart && (
                <p>
                  {t('edit_limits.period_start_change', 'Period Start: {old} → {new}', {
                    old: originalPeriodStart,
                    new: periodStart,
                  })}
                </p>
              )}
              {periodEnd !== originalPeriodEnd && (
                <p>
                  {t('edit_limits.period_end_change', 'Period End: {old} → {new}', {
                    old: originalPeriodEnd,
                    new: periodEnd,
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-xs text-blue-700">
            {t(
              'edit_limits.info',
              'These changes only affect the current billing period. Future renewals will use plan defaults unless you set new limits then.'
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={updateLimitsMutation.isPending}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges || updateLimitsMutation.isPending}
            isLoading={updateLimitsMutation.isPending}
            className="bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-700"
          >
            {t('edit_limits.update', 'Update Limits')}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
