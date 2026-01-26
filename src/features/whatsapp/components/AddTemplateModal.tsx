/**
 * Add Template Modal
 * Modal for creating a new WhatsApp message template
 * Pre-filled with sample template text
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { whatsappService } from '../services/whatsappService';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string;
}

const SAMPLE_TEMPLATE = {
  name: 'my_custom_template',
  language: 'en_US',
  category: 'UTILITY' as const,
  body: 'Hello! Thank you for contacting us. How can we help you today?',
};

export function AddTemplateModal({ isOpen, onClose, connectionId }: AddTemplateModalProps) {
  const { t } = useTranslation();
  const [templateName, setTemplateName] = useState(SAMPLE_TEMPLATE.name);
  const [language, setLanguage] = useState(SAMPLE_TEMPLATE.language);
  const [category, setCategory] = useState(SAMPLE_TEMPLATE.category);
  const [body, setBody] = useState(SAMPLE_TEMPLATE.body);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => whatsappService.createTemplate(connectionId, {
      name: templateName,
      language,
      category,
      body,
    }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(t('whatsapp.template_created_success', { name: templateName, status: data.status || 'PENDING' }));
        queryClient.invalidateQueries({ queryKey: ['whatsapp', 'templates', connectionId] });
        onClose();
      } else {
        toast.error(data.error || t('whatsapp.template_created_error'));
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || t('whatsapp.template_created_error'));
    },
  });

  const handleSubmit = () => {
    if (!templateName || !language || !category || !body) {
      toast.error(t('whatsapp.all_fields_required'));
      return;
    }
    createMutation.mutate();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('whatsapp.create_template_title')}
      subtitle={t('whatsapp.create_template_subtitle')}
      maxWidth="2xl"
      isLoading={createMutation.isPending}
      closable={!createMutation.isPending}
    >
      <div className="space-y-6">
        {/* Sample Template Preview */}
        <div className="space-y-4">

          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('whatsapp.template_name')}
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('whatsapp.template_name_placeholder')}
            />
            <p className="mt-1 text-xs text-neutral-500">
              {t('whatsapp.template_name_hint')}
            </p>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('whatsapp.language')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en_US">{t('whatsapp.language_en_us')}</option>
              <option value="en_GB">{t('whatsapp.language_en_gb')}</option>
              <option value="ar">{t('whatsapp.language_ar')}</option>
              <option value="es">{t('whatsapp.language_es')}</option>
              <option value="fr">{t('whatsapp.language_fr')}</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('whatsapp.category')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'UTILITY' | 'MARKETING' | 'AUTHENTICATION')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="UTILITY">{t('whatsapp.category_utility')}</option>
              <option value="MARKETING">{t('whatsapp.category_marketing')}</option>
              <option value="AUTHENTICATION">{t('whatsapp.category_authentication')}</option>
            </select>
            <p className="mt-1 text-xs text-neutral-500">
              {t('whatsapp.category_hint')}
            </p>
          </div>

          {/* Body Text */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('whatsapp.message_body')}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder={t('whatsapp.message_body_placeholder')}
            />
            <p className="mt-1 text-xs text-neutral-500">
              {t('whatsapp.message_body_hint')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? t('whatsapp.creating') : t('whatsapp.submit')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
