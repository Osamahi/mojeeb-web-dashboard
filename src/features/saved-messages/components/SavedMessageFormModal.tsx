/**
 * SavedMessageFormModal
 * Create/edit form for a quick-reply template.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import {
  useCreateSavedMessage,
  useUpdateSavedMessage,
} from '../hooks/useSavedMessages';
import type { SavedMessage } from '../types/savedMessages.types';

interface SavedMessageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  /** When provided, the modal opens in edit mode for this message. */
  message?: SavedMessage | null;
}

const TITLE_MAX = 100;
const SHORTCUT_MAX = 30;
const CONTENT_MAX = 5000;

export function SavedMessageFormModal({
  isOpen,
  onClose,
  agentId,
  message,
}: SavedMessageFormModalProps) {
  const { t } = useTranslation();
  const isEdit = !!message;

  const createMutation = useCreateSavedMessage(agentId);
  const updateMutation = useUpdateSavedMessage(agentId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [shortcut, setShortcut] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShortcut(message?.shortcut ?? '');
      setContent(message?.content ?? '');
      setError(null);
    }
  }, [isOpen, message]);

  const normalizedShortcut = shortcut.trim().replace(/^\//, '').toLowerCase();

  const validate = (): string | null => {
    if (!normalizedShortcut) return t('saved_messages.errors.shortcut_required');
    if (normalizedShortcut.length > SHORTCUT_MAX)
      return t('saved_messages.errors.shortcut_too_long', { max: SHORTCUT_MAX });
    if (/\s/.test(normalizedShortcut))
      return t('saved_messages.errors.shortcut_no_spaces');
    if (!content.trim()) return t('saved_messages.errors.content_required');
    if (content.length > CONTENT_MAX)
      return t('saved_messages.errors.content_too_long', { max: CONTENT_MAX });
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    // Title is auto-derived from shortcut for now (UI-hidden field, backend
    // contract unchanged). Cap to TITLE_MAX defensively.
    const derivedTitle = normalizedShortcut.slice(0, TITLE_MAX);

    const payload = {
      title: derivedTitle,
      shortcut: normalizedShortcut,
      content: content.trim(),
    };

    try {
      if (isEdit && message) {
        await updateMutation.mutateAsync({ id: message.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      // Toast is handled by hook; keep modal open so user can retry.
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('saved_messages.edit_title') : t('saved_messages.create_title')}
      subtitle={t('saved_messages.form_subtitle')}
      maxWidth="md"
      isLoading={isPending}
      closable={!isPending}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('saved_messages.field_shortcut')}
          </label>
          <div className="flex items-stretch">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-neutral-300 bg-neutral-50 text-neutral-500 text-sm">
              /
            </span>
            <input
              type="text"
              value={shortcut}
              onChange={(e) => setShortcut(e.target.value.replace(/\s/g, ''))}
              maxLength={SHORTCUT_MAX}
              placeholder={t('saved_messages.field_shortcut_placeholder')}
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-r-lg outline-none focus:border-neutral-500 text-sm"
              disabled={isPending}
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {t('saved_messages.field_shortcut_help')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('saved_messages.field_content')}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={CONTENT_MAX}
            rows={5}
            placeholder={t('saved_messages.field_content_placeholder')}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:border-neutral-500 text-sm resize-y"
            disabled={isPending}
          />
          <div className="mt-1 text-xs text-neutral-500 text-end">
            {content.length} / {CONTENT_MAX}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-neutral-950 hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isPending
              ? t('common.saving')
              : isEdit
                ? t('common.save')
                : t('common.create')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
