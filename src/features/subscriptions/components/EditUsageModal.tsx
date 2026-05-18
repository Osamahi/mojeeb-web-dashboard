import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionDetails } from '../types/subscription.types';

interface EditUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  subscription: SubscriptionDetails;
}

export function EditUsageModal({
  isOpen,
  onClose,
  onSuccess,
  subscription,
}: EditUsageModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [messagesUsed, setMessagesUsed] = useState<string>(subscription.messagesUsed.toString());
  const [agentsUsed, setAgentsUsed] = useState<string>(subscription.agentsUsed.toString());

  useEffect(() => {
    if (isOpen) {
      setMessagesUsed(subscription.messagesUsed.toString());
      setAgentsUsed(subscription.agentsUsed.toString());
    }
  }, [isOpen, subscription]);

  const hasChanges =
    messagesUsed !== subscription.messagesUsed.toString() ||
    agentsUsed !== subscription.agentsUsed.toString();

  const updateMutation = useMutation({
    mutationFn: () => {
      const messagesUsedValue =
        messagesUsed !== subscription.messagesUsed.toString() ? parseInt(messagesUsed, 10) : null;
      const agentsUsedValue =
        agentsUsed !== subscription.agentsUsed.toString() ? parseInt(agentsUsed, 10) : null;

      return subscriptionService.adminUpdateUsage(
        subscription.id,
        messagesUsedValue,
        agentsUsedValue
      );
    },
    onSuccess: () => {
      toast.success(t('edit_usage.success', 'Usage updated successfully'));
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', subscription.id] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage', subscription.id] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to update usage:', error);
      toast.error(
        error.response?.data?.message ||
          t('edit_usage.error', 'Failed to update usage')
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      toast.info(t('edit_usage.no_changes', 'No changes made'));
      return;
    }

    const messagesUsedNum = parseInt(messagesUsed, 10);
    const agentsUsedNum = parseInt(agentsUsed, 10);

    if (isNaN(messagesUsedNum) || messagesUsedNum < 0) {
      toast.error(t('edit_usage.invalid_messages_used', 'Messages used must be 0 or greater'));
      return;
    }
    if (isNaN(agentsUsedNum) || agentsUsedNum < 0) {
      toast.error(t('edit_usage.invalid_agents_used', 'Agents used must be 0 or greater'));
      return;
    }

    updateMutation.mutate();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('edit_usage.title', 'Edit Usage Counters')}
      subtitle={t('edit_usage.subtitle', 'Manually adjust the current billing period counters')}
      maxWidth="md"
      isLoading={updateMutation.isPending}
      closable={!updateMutation.isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Subscription Info */}
        <div className="rounded-lg bg-neutral-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-neutral-700">
            {t('edit_usage.current_subscription', 'Current Subscription')}
          </h3>
          <div className="space-y-1 text-sm text-neutral-600">
            <p>
              <span className="font-medium">{t('edit_usage.organization', 'Organization')}:</span>{' '}
              {subscription.organizationName}
            </p>
            <p>
              <span className="font-medium">{t('edit_usage.plan', 'Plan')}:</span>{' '}
              {subscription.planName} ({subscription.planCode})
            </p>
          </div>
        </div>

        {/* Messages Used */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="messagesUsed" className="block text-sm font-medium text-neutral-700">
              {t('edit_usage.messages_used', 'Messages Used')}
            </label>
            <button
              type="button"
              onClick={() => setMessagesUsed('0')}
              disabled={updateMutation.isPending || messagesUsed === '0'}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:text-neutral-400"
            >
              {t('edit_usage.reset_to_zero', 'Reset to 0')}
            </button>
          </div>
          <input
            type="number"
            id="messagesUsed"
            value={messagesUsed}
            onChange={(e) => setMessagesUsed(e.target.value)}
            min="0"
            step="1"
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={updateMutation.isPending}
          />
          <p className="mt-1 text-xs text-neutral-500">
            {t('edit_usage.messages_used_help', 'Current: {{used}} / {{limit}}', {
              used: subscription.messagesUsed,
              limit: subscription.messageLimit === 0 ? 'Unlimited' : subscription.messageLimit,
            })}
          </p>
        </div>

        {/* Agents Used */}
        <div>
          <label htmlFor="agentsUsed" className="block text-sm font-medium text-neutral-700">
            {t('edit_usage.agents_used', 'Agents Used')}
          </label>
          <input
            type="number"
            id="agentsUsed"
            value={agentsUsed}
            onChange={(e) => setAgentsUsed(e.target.value)}
            min="0"
            step="1"
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={updateMutation.isPending}
          />
          <p className="mt-1 text-xs text-neutral-500">
            {t('edit_usage.agents_used_help', 'Current: {{used}} / {{limit}}', {
              used: subscription.agentsUsed,
              limit: subscription.agentLimit === 0 ? 'Unlimited' : subscription.agentLimit,
            })}
          </p>
          <p className="mt-1 text-xs text-amber-600">
            {t(
              'edit_usage.agents_used_warning',
              'Note: this is auto-recalculated when an agent is created or deleted. Manual edits are temporary.'
            )}
          </p>
        </div>

        {/* Preview Changes */}
        {hasChanges && (
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
            <h3 className="mb-2 text-sm font-medium text-green-900">
              {t('edit_usage.preview', 'Preview Changes')}
            </h3>
            <div className="space-y-1 text-sm text-green-800">
              {messagesUsed !== subscription.messagesUsed.toString() && (
                <p>
                  {t('edit_usage.messages_change', 'Messages Used: {{old}} → {{new}}', {
                    old: subscription.messagesUsed,
                    new: messagesUsed,
                  })}
                </p>
              )}
              {agentsUsed !== subscription.agentsUsed.toString() && (
                <p>
                  {t('edit_usage.agents_change', 'Agents Used: {{old}} → {{new}}', {
                    old: subscription.agentsUsed,
                    new: agentsUsed,
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges || updateMutation.isPending}
            isLoading={updateMutation.isPending}
            className="bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-700"
          >
            {t('edit_usage.update', 'Update Usage')}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
