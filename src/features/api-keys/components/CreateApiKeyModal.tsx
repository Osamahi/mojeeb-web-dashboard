import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { BaseModal } from '@/components/ui/BaseModal';
import { useCreateApiKey } from '../hooks/useApiKeys';
import { isToastHandled } from '@/lib/errors';

const QUICKSTART_URL = 'https://docs.mojeeb.app/docs/developers/quickstart';

interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CreateApiKeyModal
 *
 * Two-stage UX:
 *   1. Form: name only (scope is locked to whatsapp:send for v1; key works
 *      on all org agents — per-agent restriction lives in the backend
 *      contract but isn't surfaced in this UI yet).
 *   2. Reveal: shows the plain key ONCE with a copy button + warning that
 *      it cannot be retrieved again. Closing this stage refreshes the list.
 *
 * When more scopes land (whatsapp:read, messenger:send, instagram:send),
 * restore the scope picker. When per-agent restriction has a real customer
 * use case, add it back as an "Advanced" disclosure — radio buttons in the
 * primary flow felt confusing.
 */
export function CreateApiKeyModal({ isOpen, onClose }: CreateApiKeyModalProps) {
  const { t } = useTranslation();
  const createMutation = useCreateApiKey();

  const [name, setName] = useState('');
  const [createdPlainKey, setCreatedPlainKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setName('');
    setCreatedPlainKey(null);
    setCopied(false);
  };

  const handleClose = () => {
    if (createMutation.isPending) return;
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (name.trim().length === 0) {
      toast.error(t('api_keys.create_modal.name_required', 'Name is required'));
      return;
    }

    try {
      const response = await createMutation.mutateAsync({
        name: name.trim(),
        // Only scope available in v1. agent_ids omitted = backend defaults
        // to "all org agents" — matches the static info card the customer
        // sees in the form.
        scopes: ['whatsapp:send'],
      });
      setCreatedPlainKey(response.plain_key);
    } catch (error) {
      if (!isToastHandled(error)) {
        toast.error(t('api_keys.create_modal.create_failed', 'Failed to create API key'));
      }
    }
  };

  const handleCopy = async () => {
    if (!createdPlainKey) return;
    try {
      await navigator.clipboard.writeText(createdPlainKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('api_keys.create_modal.copy_failed', 'Could not copy to clipboard'));
    }
  };

  const isReveal = createdPlainKey !== null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        isReveal
          ? t('api_keys.create_modal.reveal_title', 'Save your API key')
          : t('api_keys.create_modal.title', 'Create API Key')
      }
      subtitle={
        isReveal
          ? t(
              'api_keys.create_modal.reveal_subtitle',
              'This is the only time you will see this key. Copy it now.'
            )
          : t(
              'api_keys.create_modal.subtitle',
              'Issue a new credential for the Mojeeb public API'
            )
      }
      maxWidth="md"
      isLoading={createMutation.isPending}
      closable={!createMutation.isPending}
    >
      {!isReveal ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('api_keys.create_modal.name_label', 'Name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('api_keys.create_modal.name_placeholder', 'e.g. Production CRM') ?? ''}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              maxLength={100}
            />
          </div>

          {/* Scopes section is hidden while there's only one available option
              (whatsapp:send). The state still holds it selected so the create
              request goes through with the right scope. When messenger:send /
              instagram:send / whatsapp:read land, restore the picker so
              customers can pick. */}

          {/* Agents: always "all agents" for v1. Per-agent restriction was
              spec'd but customers found the radio confusing — we may bring
              back a separate "Restrict to agents" advanced section later as
              a collapsed disclosure, not as a primary choice. The backend
              still accepts agent_ids[] and the static info card below tells
              the customer exactly what they're getting. */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
            <div className="font-medium text-neutral-900">
              {t('api_keys.create_modal.agents_all', 'All agents')}
            </div>
            <div className="text-xs text-neutral-600 mt-1">
              {t(
                'api_keys.create_modal.agents_all_desc',
                'Key works on every agent in your organization, including future ones.'
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              disabled={createMutation.isPending}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending
                ? t('common.creating', 'Creating…')
                : t('api_keys.create_modal.create_cta', 'Create key')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">
              {t(
                'api_keys.create_modal.reveal_warning',
                'Store this key in a secure place. We will not show it again.'
              )}
            </p>
          </div>

          <div className="font-mono text-sm bg-neutral-50 border border-neutral-200 rounded-lg p-3 break-all">
            {createdPlainKey}
          </div>

          {/* Next-steps hint — they have the key, now point them at the
              quickstart so they don't have to hunt for it. */}
          <a
            href={QUICKSTART_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors group"
          >
            <BookOpen className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700">
                {t('api_keys.create_modal.next_steps_title', 'Next: send your first message')}
              </div>
              <div className="text-xs text-neutral-600">
                {t(
                  'api_keys.create_modal.next_steps_desc',
                  'Open the Quickstart for a 5-minute curl walkthrough.'
                )}
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
          </a>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied
                ? t('common.copied', 'Copied!')
                : t('common.copy', 'Copy')}
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              {t('common.done', 'Done')}
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}

export default CreateApiKeyModal;
