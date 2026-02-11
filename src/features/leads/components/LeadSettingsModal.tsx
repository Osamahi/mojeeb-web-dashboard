/**
 * LeadSettingsModal Component
 * Allows editing the AI prompt for the lead capture action
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useInfiniteActions } from '@/features/actions/hooks/useActions';
import { useUpdateAction } from '@/features/actions/hooks/useMutateAction';
import { useAgentContext } from '@/hooks/useAgentContext';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LeadSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeadSettingsModal({ isOpen, onClose }: LeadSettingsModalProps) {
  const { t } = useTranslation();
  const { agentId } = useAgentContext();
  const [prompt, setPrompt] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  // Fetch all actions for the current agent (can't filter by type since it's stored incorrectly)
  const { data: actionsData, isLoading: isFetchingActions } = useInfiniteActions();

  // Update mutation
  const updateMutation = useUpdateAction();

  // Find the lead capture action by name pattern (case-insensitive)
  const leadAction = actionsData?.actions?.find(
    action => action.name?.toLowerCase().includes('capture') ||
              action.name?.toLowerCase().includes('lead')
  );

  // Initialize prompt when modal opens or lead action is loaded
  useEffect(() => {
    if (isOpen && leadAction) {
      setPrompt(leadAction.triggerPrompt || '');
      setActionId(leadAction.id);
    }
  }, [isOpen, leadAction]);

  // Handle save
  const handleSave = async () => {
    if (!actionId) return;

    await updateMutation.mutateAsync(
      {
        actionId,
        request: {
          triggerPrompt: prompt,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setActionId(null);
    }
  }, [isOpen]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('leads.lead_settings_title')}
      maxWidth="2xl"
      isLoading={updateMutation.isPending}
      closable={!updateMutation.isPending}
    >
      <div className="space-y-4">
        {/* Loading state */}
        {isFetchingActions && (
          <div className="space-y-4">
            {/* Label skeleton */}
            <div className="space-y-2">
              <Skeleton height="20px" width="180px" />
              {/* Textarea skeleton */}
              <Skeleton height="288px" className="rounded-lg" />
              {/* Help text skeleton */}
              <Skeleton height="14px" width="70%" />
            </div>
            {/* Button skeleton */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Skeleton height="40px" width="100px" className="rounded-lg" />
              <Skeleton height="40px" width="120px" className="rounded-lg" />
            </div>
          </div>
        )}

        {/* No lead action found */}
        {!isFetchingActions && !leadAction && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
            <p className="text-sm text-neutral-600">
              {t('leads.no_lead_action_found')}
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              {t('leads.create_lead_action')}
            </p>
          </div>
        )}

        {/* Prompt editor */}
        {!isFetchingActions && leadAction && (
          <>
            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-mojeeb focus:border-transparent resize-none text-sm leading-relaxed font-sans ltr:text-left rtl:text-right"
                placeholder={t('leads.trigger_prompt_help')}
                disabled={updateMutation.isPending}
              />
              <p className="mt-2 text-xs text-neutral-500 ltr:text-left rtl:text-right">
                {t('leads.trigger_prompt_help')}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('leads.cancel_button')}
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending || !prompt.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-mojeeb rounded-lg hover:bg-brand-mojeeb/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {updateMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {t('leads.save_settings')}
              </button>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}
