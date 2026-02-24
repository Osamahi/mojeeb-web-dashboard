import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BaseModal } from '@/components/ui/BaseModal';
import { appConfigService } from '../services/appConfigService';
import type { AppConfigItem, CreateAppConfigDto, UpdateAppConfigDto } from '../types/appconfig.types';

interface AppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass existing config for edit mode; omit for create mode */
  config?: AppConfigItem | null;
}

export default function AppConfigModal({ isOpen, onClose, config }: AppConfigModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = !!config;

  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when modal opens
  useEffect(() => {
    if (isOpen && config) {
      setKey(config.key);
      setValue(config.value);
      setDescription(config.description || '');
    } else if (isOpen && !config) {
      setKey('');
      setValue('');
      setDescription('');
    }
    setErrors({});
  }, [isOpen, config]);

  const createMutation = useMutation({
    mutationFn: (data: CreateAppConfigDto) => appConfigService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-app-configs'] });
      toast.success(t('app_config.create_success'));
      onClose();
    },
    onError: () => {
      toast.error(t('app_config.create_error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppConfigDto }) =>
      appConfigService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-app-configs'] });
      toast.success(t('app_config.update_success'));
      onClose();
    },
    onError: () => {
      toast.error(t('app_config.update_error'));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!key.trim()) newErrors.key = t('app_config.error_key_required');
    if (!value.trim()) newErrors.value = t('app_config.error_value_required');
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (isEditMode && config) {
      updateMutation.mutate({
        id: config.id,
        data: {
          value: value.trim(),
          description: description.trim() || undefined,
        },
      });
    } else {
      createMutation.mutate({
        key: key.trim(),
        value: value.trim(),
        description: description.trim() || undefined,
      });
    }
  };

  const handleChange = (field: string, newValue: string) => {
    if (field === 'key') setKey(newValue);
    else if (field === 'value') setValue(newValue);
    else if (field === 'description') setDescription(newValue);

    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('app_config.modal_edit_title') : t('app_config.modal_add_title')}
      subtitle={isEditMode ? t('app_config.modal_edit_subtitle') : t('app_config.modal_add_subtitle')}
      maxWidth="md"
      isLoading={isPending}
      closable={!isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Key Field */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t('app_config.field_key')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => handleChange('key', e.target.value)}
            placeholder={t('app_config.field_key_placeholder')}
            disabled={isPending || isEditMode}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-neutral-100 disabled:text-neutral-500 font-mono"
          />
          {errors.key && <p className="mt-1 text-xs text-red-600">{errors.key}</p>}
        </div>

        {/* Value Field */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t('app_config.field_value')} <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={value}
            onChange={(e) => handleChange('value', e.target.value)}
            placeholder={t('app_config.field_value_placeholder')}
            disabled={isPending}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-neutral-100"
          />
          {errors.value && <p className="mt-1 text-xs text-red-600">{errors.value}</p>}
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t('app_config.field_description')}
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder={t('app_config.field_description_placeholder')}
            disabled={isPending}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-neutral-100"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPending
              ? t('common.saving')
              : isEditMode
                ? t('app_config.btn_update')
                : t('app_config.btn_create')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
