/**
 * Transfer Confirmation Step
 *
 * Rendered in place of AccountSelectStep when the backend reports a 409
 * conflict — i.e. the chosen account is already connected under another agent.
 * The user explicitly confirms (or cancels) before we re-issue the connect
 * request with `confirmTransferFromOtherAgent: true`.
 *
 * Same-org conflicts show the existing agent's name. Cross-org conflicts
 * deliberately omit the name (privacy across workspaces).
 */

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ConnectionConflictInfo } from '../../types';

type TransferConfirmationStepProps = {
  conflict: ConnectionConflictInfo;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const TransferConfirmationStep = memo(function TransferConfirmationStep({
  conflict,
  isPending,
  onConfirm,
  onCancel,
}: TransferConfirmationStepProps) {
  const { t } = useTranslation();

  // Same-org: we know the agent name, show it in the message.
  // Cross-org: name is intentionally null; copy refers to "another workspace".
  const message =
    conflict.conflictType === 'same_org' && conflict.existingAgentName
      ? t('connections.transfer_message_same_org', {
          accountName: conflict.accountName,
          agentName: conflict.existingAgentName,
        })
      : t('connections.transfer_message_cross_org', {
          accountName: conflict.accountName,
        });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900">
            {t('connections.transfer_title')}
          </h3>
          <p className="mt-1 text-sm text-amber-800">{message}</p>
          <p className="mt-2 text-xs text-amber-700">{t('connections.transfer_history_note')}</p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? t('connections.transfer_confirming') : t('connections.transfer_confirm_action')}
        </button>
      </div>
    </div>
  );
});
