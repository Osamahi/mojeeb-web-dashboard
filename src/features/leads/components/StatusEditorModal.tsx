/**
 * StatusEditorModal Component
 * Simple modal for editing lead status options (value, labels, colors).
 * Uses EnumOptionsEditor with "new" status protected from editing/deletion.
 * Uses BaseModal following project standards.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { EnumOptionsEditor } from './EnumOptionsEditor';
import { useLeadStatusSchema } from '../hooks/useLeadStatusSchema';
import { useUpdateCustomFieldSchema } from '../hooks/useCustomFieldSchemas';
import type { EnumOption } from '../types/customFieldSchema.types';

interface StatusEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatusEditorModal({ isOpen, onClose }: StatusEditorModalProps) {
  const { t } = useTranslation();
  const { statusOptions, statusSchema } = useLeadStatusSchema();
  const updateMutation = useUpdateCustomFieldSchema();

  // Local editing state (copy of options)
  const [options, setOptions] = useState<EnumOption[]>([]);

  // Sync on open
  useEffect(() => {
    if (isOpen && statusOptions.length > 0) {
      setOptions(statusOptions.map((o) => ({ ...o })));
    }
  }, [isOpen, statusOptions]);

  // --- Validation ---

  const validate = useCallback((): string | null => {
    if (options.length === 0) return t('leads.must_have_at_least_one_status');

    const values = options.map((o) => o.value?.trim().toLowerCase()).filter(Boolean);
    if (values.length !== options.length) return t('leads.all_statuses_must_have_value');

    // Check duplicates
    if (new Set(values).size !== values.length) return t('leads.duplicate_status_values');

    // "new" is mandatory
    if (!values.includes('new')) return t('leads.new_status_required');

    // Labels required
    for (const opt of options) {
      if (!opt.label_en?.trim()) return t('leads.english_label_required_for', { value: opt.value });
      if (!opt.label_ar?.trim()) return t('leads.arabic_label_required_for', { value: opt.value });
    }

    return null;
  }, [options, t]);

  // --- Save ---

  const handleSave = useCallback(() => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    if (!statusSchema) {
      toast.error(t('leads.status_schema_not_found'));
      return;
    }

    // Normalize values to lowercase
    const normalizedOptions = options.map((opt) => ({
      ...opt,
      value: opt.value.trim().toLowerCase(),
    }));

    updateMutation.mutate(
      {
        schemaId: statusSchema.id,
        data: { options: normalizedOptions },
      },
      {
        onSuccess: () => {
          toast.success(t('leads.statuses_updated'));
          onClose();
        },
      }
    );
  }, [options, statusSchema, validate, updateMutation, onClose, t]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('leads.manage_statuses')}
      subtitle={t('leads.manage_statuses_description')}
      maxWidth="2xl"
      isLoading={updateMutation.isPending}
      closable={!updateMutation.isPending}
    >
      <div className="space-y-4">
        {/* Dropdown Options Editor (with "new" protected) */}
        <EnumOptionsEditor
          options={options}
          onChange={setOptions}
          protectedValues={['new']}
        />

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={updateMutation.isPending}
          >
            {t('common.save_changes')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
