/**
 * Add Template Modal
 * Modal for creating a new WhatsApp message template
 * Supports body text and optional buttons (URL, Phone Number, Quick Reply)
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Link, Phone, MessageSquareReply } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { whatsappService } from '../services/whatsappService';
import type { CreateTemplateButtonInput } from '../types/whatsapp.types';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string;
}

type ButtonType = 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';

const SAMPLE_TEMPLATE = {
  name: 'my_custom_template',
  language: 'en_US',
  category: 'UTILITY' as const,
  body: 'Hello! Thank you for contacting us. How can we help you today?',
};

const BUTTON_TYPE_CONFIG: Record<ButtonType, { label: string; icon: typeof Link; color: string }> = {
  URL: { label: 'URL', icon: Link, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  PHONE_NUMBER: { label: 'Phone Number', icon: Phone, color: 'bg-green-50 text-green-700 border-green-200' },
  QUICK_REPLY: { label: 'Quick Reply', icon: MessageSquareReply, color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

// Meta limits: max 10 buttons, max 3 URL, max 1 phone, max 10 quick reply
const MAX_BUTTONS = 10;

export function AddTemplateModal({ isOpen, onClose, connectionId }: AddTemplateModalProps) {
  const { t } = useTranslation();
  const [templateName, setTemplateName] = useState(SAMPLE_TEMPLATE.name);
  const [language, setLanguage] = useState(SAMPLE_TEMPLATE.language);
  const [category, setCategory] = useState(SAMPLE_TEMPLATE.category);
  const [body, setBody] = useState(SAMPLE_TEMPLATE.body);
  const [buttons, setButtons] = useState<CreateTemplateButtonInput[]>([]);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => whatsappService.createTemplate(connectionId, {
      name: templateName,
      language,
      category,
      body,
      buttons: buttons.length > 0 ? buttons : undefined,
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

    // Validate buttons
    for (const btn of buttons) {
      if (!btn.text.trim()) {
        toast.error('All buttons must have a label');
        return;
      }
      if (btn.type === 'URL' && !btn.url?.trim()) {
        toast.error('URL buttons must have a URL');
        return;
      }
      if (btn.type === 'PHONE_NUMBER' && !btn.phone_number?.trim()) {
        toast.error('Phone number buttons must have a phone number');
        return;
      }
    }

    createMutation.mutate();
  };

  const addButton = (type: ButtonType) => {
    if (buttons.length >= MAX_BUTTONS) {
      toast.error(`Maximum ${MAX_BUTTONS} buttons allowed`);
      return;
    }

    // Meta API: Quick Reply buttons cannot be mixed with URL/Phone buttons
    const hasQuickReply = buttons.some(b => b.type === 'QUICK_REPLY');
    const hasCta = buttons.some(b => b.type === 'URL' || b.type === 'PHONE_NUMBER');

    if (type === 'QUICK_REPLY' && hasCta) {
      toast.error('Quick Reply buttons cannot be mixed with URL or Phone buttons');
      return;
    }
    if ((type === 'URL' || type === 'PHONE_NUMBER') && hasQuickReply) {
      toast.error('URL/Phone buttons cannot be mixed with Quick Reply buttons');
      return;
    }

    // Check type-specific limits
    const urlCount = buttons.filter(b => b.type === 'URL').length;
    const phoneCount = buttons.filter(b => b.type === 'PHONE_NUMBER').length;
    const quickReplyCount = buttons.filter(b => b.type === 'QUICK_REPLY').length;

    if (type === 'URL' && urlCount >= 2) {
      toast.error('Maximum 2 URL buttons allowed');
      return;
    }
    if (type === 'PHONE_NUMBER' && phoneCount >= 1) {
      toast.error('Maximum 1 phone number button allowed');
      return;
    }
    if (type === 'QUICK_REPLY' && quickReplyCount >= 10) {
      toast.error('Maximum 10 Quick Reply buttons allowed');
      return;
    }

    const newButton: CreateTemplateButtonInput = {
      type,
      text: '',
      ...(type === 'URL' ? { url: '' } : {}),
      ...(type === 'PHONE_NUMBER' ? { phone_number: '' } : {}),
    };

    setButtons([...buttons, newButton]);
  };

  const updateButton = (index: number, updates: Partial<CreateTemplateButtonInput>) => {
    setButtons(prev => prev.map((btn, i) => i === index ? { ...btn, ...updates } : btn));
  };

  const removeButton = (index: number) => {
    setButtons(prev => prev.filter((_, i) => i !== index));
  };

  // Check what button types are still available
  // Meta API: Quick Reply and CTA (URL/Phone) are mutually exclusive
  const hasQuickReply = buttons.some(b => b.type === 'QUICK_REPLY');
  const hasCta = buttons.some(b => b.type === 'URL' || b.type === 'PHONE_NUMBER');
  const urlCount = buttons.filter(b => b.type === 'URL').length;
  const phoneCount = buttons.filter(b => b.type === 'PHONE_NUMBER').length;
  const quickReplyCount = buttons.filter(b => b.type === 'QUICK_REPLY').length;
  const canAddUrl = !hasQuickReply && urlCount < 2;
  const canAddPhone = !hasQuickReply && phoneCount < 1;
  const canAddQuickReply = !hasCta && quickReplyCount < 10;
  const canAddMore = buttons.length < MAX_BUTTONS;

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
        {/* Template Fields */}
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

          {/* Buttons Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-700">
                Buttons
                <span className="ml-1 text-xs font-normal text-neutral-400">(optional)</span>
              </label>
              {buttons.length > 0 && (
                <span className="text-xs text-neutral-500">
                  {buttons.length}/{hasQuickReply ? 10 : 3}
                </span>
              )}
            </div>

            {/* Existing Buttons */}
            {buttons.length > 0 && (
              <div className="space-y-3 mb-3">
                {buttons.map((btn, index) => {
                  const config = BUTTON_TYPE_CONFIG[btn.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-3 ${config.color}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-medium">{config.label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeButton(index)}
                          className="p-1 rounded hover:bg-black/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* Button Label */}
                        <input
                          type="text"
                          value={btn.text}
                          onChange={(e) => updateButton(index, { text: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-sm border border-current/20 rounded-md bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-current/40"
                          placeholder="Button label"
                          maxLength={25}
                        />

                        {/* URL field for URL buttons */}
                        {btn.type === 'URL' && (
                          <input
                            type="url"
                            value={btn.url || ''}
                            onChange={(e) => updateButton(index, { url: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm border border-current/20 rounded-md bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-current/40"
                            placeholder="https://example.com"
                          />
                        )}

                        {/* Phone field for Phone Number buttons */}
                        {btn.type === 'PHONE_NUMBER' && (
                          <input
                            type="tel"
                            value={btn.phone_number || ''}
                            onChange={(e) => updateButton(index, { phone_number: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm border border-current/20 rounded-md bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-current/40"
                            placeholder="+1234567890"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Button Actions */}
            {canAddMore && (canAddUrl || canAddPhone || canAddQuickReply) && (
              <div className="flex flex-wrap gap-2">
                {canAddUrl && (
                  <button
                    type="button"
                    onClick={() => addButton('URL')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <Link className="w-3.5 h-3.5" />
                    URL
                  </button>
                )}
                {canAddPhone && (
                  <button
                    type="button"
                    onClick={() => addButton('PHONE_NUMBER')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <Phone className="w-3.5 h-3.5" />
                    Phone
                  </button>
                )}
                {canAddQuickReply && (
                  <button
                    type="button"
                    onClick={() => addButton('QUICK_REPLY')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <MessageSquareReply className="w-3.5 h-3.5" />
                    Quick Reply
                  </button>
                )}
              </div>
            )}

            {buttons.length === 0 && (
              <p className="mt-1 text-xs text-neutral-500">
                Add interactive buttons to your template. URL opens a link, Phone dials a number, Quick Reply sends a predefined response. Note: Quick Reply cannot be mixed with URL/Phone buttons.
              </p>
            )}

            {buttons.length > 0 && (hasQuickReply || hasCta) && (
              <p className="mt-2 text-xs text-amber-600">
                {hasQuickReply
                  ? `Quick Reply mode — max 10 buttons (${quickReplyCount}/10). Cannot add URL or Phone buttons.`
                  : `CTA mode — max 2 URL + 1 Phone. Cannot add Quick Reply buttons.`}
              </p>
            )}
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
