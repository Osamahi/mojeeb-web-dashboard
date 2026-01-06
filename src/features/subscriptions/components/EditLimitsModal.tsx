/**
 * Edit Subscription Limits Modal
 * Allows SuperAdmin to manually adjust message and agent limits for the current billing period
 * Modifies the active subscription_usage_record, not the subscription or plan
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

  // Reset form when modal opens or subscription changes
  useEffect(() => {
    if (isOpen) {
      setMessageLimit(subscription.messageLimit.toString());
      setAgentLimit(subscription.agentLimit.toString());
    }
  }, [isOpen, subscription]);

  // Check if anything changed
  const hasChanges =
    messageLimit !== subscription.messageLimit.toString() ||
    agentLimit !== subscription.agentLimit.toString();

  // Mutation for updating limits
  const updateLimitsMutation = useMutation({
    mutationFn: () => {
      const messageLimitValue = messageLimit === '' ? null : parseInt(messageLimit, 10);
      const agentLimitValue = agentLimit === '' ? null : parseInt(agentLimit, 10);

      return subscriptionService.adminUpdateLimits(
        subscription.id,
        messageLimitValue,
        agentLimitValue
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

    updateLimitsMutation.mutate();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('edit_limits.title', 'Edit Subscription Limits')}
      subtitle={t(
        'edit_limits.subtitle',
        'Adjust limits for the current billing period (0 = unlimited)'
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
