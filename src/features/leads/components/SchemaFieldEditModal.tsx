/**
 * SchemaFieldEditModal
 *
 * Generic edit modal for any free-text field — system or custom. Picks the
 * input element by `schema.field_type`:
 *   text                                                                → <textarea>
 *   string / number / currency / email / url / phone                   → <input>
 *
 * The modal owns its draft state and the input UX (placeholder, Enter to save
 * for single-line, Cmd/Ctrl+Enter for textarea). It does NOT own persistence —
 * the caller supplies `onSave(value)` so the same modal can target either a
 * top-level Lead column (e.g. `lead.summary`) or the `customFields` JSONB bag.
 * Pickers (enum, boolean, date, datetime) edit inline in the cell and don't
 * use this modal.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import type { CustomFieldSchema } from '../types/customFieldSchema.types';

interface SchemaFieldEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Lead display name for the modal title. Optional. */
  leadName?: string;
  schema: CustomFieldSchema;
  /** Initial draft value. Use empty string for an unset field. */
  currentValue?: string;
  /** Persist the new value. Trimmed value is passed; empty string means "clear". */
  onSave: (value: string) => Promise<void>;
  /** True while the parent mutation is in flight. Disables Save + blocks close. */
  isSaving: boolean;
}

/** Map a field type to the native input type. */
function inputTypeFor(fieldType: CustomFieldSchema['field_type']): string {
  switch (fieldType) {
    case 'number':
    case 'currency':
      return 'number';
    case 'email':
      return 'email';
    case 'url':
      return 'url';
    case 'phone':
      return 'tel';
    default:
      return 'text';
  }
}

export function SchemaFieldEditModal({
  isOpen,
  onClose,
  leadName,
  schema,
  currentValue = '',
  onSave,
  isSaving,
}: SchemaFieldEditModalProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith('ar');
  const fieldName = isAr ? schema.name_ar : schema.name_en;
  const [value, setValue] = useState(currentValue);

  const handleSave = () => {
    if (isSaving) return;
    void onSave(value.trim());
  };

  const title = leadName ? `${fieldName} — ${leadName}` : fieldName;
  const isMultiline = schema.field_type === 'text';
  const placeholder = t('inline_edit.enter_value');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      isLoading={isSaving}
      closable={!isSaving}
    >
      <div className="space-y-4">
        {isMultiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={6}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none text-sm"
            autoFocus
            // Cmd/Ctrl+Enter saves; plain Enter inserts a newline (textarea default).
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        ) : (
          <input
            type={inputTypeFor(schema.field_type)}
            step={schema.field_type === 'currency' ? '0.01' : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
