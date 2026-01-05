import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { useCreatePlanMutation } from '../hooks/useCreatePlanMutation';
import type { CreatePlanRequest } from '../types/catalogue.types';

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPlanModal({ isOpen, onClose }: AddPlanModalProps) {
  const { t } = useTranslation();
  const createMutation = useCreatePlanMutation();

  const [formData, setFormData] = useState<CreatePlanRequest>({
    code: '',
    name: '',
    description: '',
    messageLimit: 1000,
    agentLimit: 1,
    trialDays: 0, // Hidden from UI but required by backend
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = t('catalogue.addModal.errors.codeRequired');
    } else if (!/^[a-z0-9_-]+$/.test(formData.code)) {
      newErrors.code = t('catalogue.addModal.errors.codeInvalid');
    }

    if (!formData.name.trim()) {
      newErrors.name = t('catalogue.addModal.errors.nameRequired');
    }

    if (formData.messageLimit < 0) {
      newErrors.messageLimit = t('catalogue.addModal.errors.messageLimitInvalid');
    }

    if (formData.agentLimit < 0) {
      newErrors.agentLimit = t('catalogue.addModal.errors.agentLimitInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      onClose();
      // Reset form
      setFormData({
        code: '',
        name: '',
        description: '',
        messageLimit: 1000,
        agentLimit: 1,
        trialDays: 0,
      });
      setErrors({});
    } catch (error) {
      // Error toast handled by mutation
      console.error('[AddPlanModal] Create failed:', error);
    }
  };

  const handleChange = (field: keyof CreatePlanRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('catalogue.addModal.title')}
      subtitle={t('catalogue.addModal.subtitle')}
      maxWidth="lg"
      isLoading={createMutation.isPending}
      closable={!createMutation.isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            {t('catalogue.addModal.sections.basicInfo')}
          </h3>

          {/* Plan Code */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-neutral-700">
              {t('catalogue.addModal.fields.code')} <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toLowerCase())}
              className={`mt-1 block w-full rounded-lg border ${
                errors.code ? 'border-danger-300' : 'border-neutral-300'
              } px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
              placeholder="e.g., starter, professional, enterprise"
              disabled={createMutation.isPending}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-danger-600">{errors.code}</p>
            )}
            <p className="mt-1 text-xs text-neutral-500">
              {t('catalogue.addModal.fields.codeHint')}
            </p>
          </div>

          {/* Plan Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
              {t('catalogue.addModal.fields.name')} <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`mt-1 block w-full rounded-lg border ${
                errors.name ? 'border-danger-300' : 'border-neutral-300'
              } px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
              placeholder="e.g., Starter Plan"
              disabled={createMutation.isPending}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
              {t('catalogue.addModal.fields.description')}
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder={t('catalogue.addModal.fields.descriptionPlaceholder')}
              disabled={createMutation.isPending}
            />
          </div>
        </div>

        {/* Limits */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            {t('catalogue.addModal.sections.limits')}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Message Limit */}
            <div>
              <label htmlFor="messageLimit" className="block text-sm font-medium text-neutral-700">
                {t('catalogue.addModal.fields.messageLimit')} <span className="text-danger-600">*</span>
              </label>
              <input
                type="number"
                id="messageLimit"
                value={formData.messageLimit}
                onChange={(e) => handleChange('messageLimit', parseInt(e.target.value) || 0)}
                min="0"
                className={`mt-1 block w-full rounded-lg border ${
                  errors.messageLimit ? 'border-danger-300' : 'border-neutral-300'
                } px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                disabled={createMutation.isPending}
              />
              {errors.messageLimit && (
                <p className="mt-1 text-xs text-danger-600">{errors.messageLimit}</p>
              )}
            </div>

            {/* Agent Limit */}
            <div>
              <label htmlFor="agentLimit" className="block text-sm font-medium text-neutral-700">
                {t('catalogue.addModal.fields.agentLimit')} <span className="text-danger-600">*</span>
              </label>
              <input
                type="number"
                id="agentLimit"
                value={formData.agentLimit}
                onChange={(e) => handleChange('agentLimit', parseInt(e.target.value) || 0)}
                min="0"
                className={`mt-1 block w-full rounded-lg border ${
                  errors.agentLimit ? 'border-danger-300' : 'border-neutral-300'
                } px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                disabled={createMutation.isPending}
              />
              {errors.agentLimit && (
                <p className="mt-1 text-xs text-danger-600">{errors.agentLimit}</p>
              )}
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="rounded-lg bg-primary-50 p-4">
          <p className="text-sm text-primary-900">
            {t('catalogue.addModal.pricingNote')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('catalogue.addModal.cancel')}
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending
              ? t('catalogue.addModal.creating')
              : t('catalogue.addModal.create')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
