/**
 * Send Template Modal
 * Modal for sending a WhatsApp template message to a phone number.
 * Auto-detects {{1}}, {{2}} placeholders and shows parameter input fields.
 */

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useSendTemplate } from '../hooks/useWhatsAppTemplates';
import type { MessageTemplate } from '../types/whatsapp.types';

interface SendTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: MessageTemplate;
  connectionId: string;
}

/**
 * Extract {{1}}, {{2}}, etc. placeholder indices from template body text.
 */
function extractPlaceholders(template: MessageTemplate): string[] {
  const bodyComponent = template.components?.find(c => c.type === 'BODY');
  const text = bodyComponent?.text || '';
  const matches = text.match(/\{\{(\d+)\}\}/g);
  if (!matches) return [];
  // Deduplicate and sort
  const unique = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
  unique.sort((a, b) => Number(a) - Number(b));
  return unique;
}

export function SendTemplateModal({
  isOpen,
  onClose,
  template,
  connectionId,
}: SendTemplateModalProps) {
  const { t } = useTranslation();
  const [recipient, setRecipient] = useState('');
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  const sendMutation = useSendTemplate();

  const placeholders = useMemo(() => extractPlaceholders(template), [template]);

  const bodyText = useMemo(() => {
    return template.components?.find(c => c.type === 'BODY')?.text || '';
  }, [template]);

  // Build preview text with parameter values substituted
  const previewText = useMemo(() => {
    let text = bodyText;
    for (const key of placeholders) {
      const value = paramValues[key] || `{{${key}}}`;
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return text;
  }, [bodyText, placeholders, paramValues]);

  const handleParamChange = (key: string, value: string) => {
    setParamValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSend = () => {
    if (!recipient.trim()) {
      toast.error(t('whatsapp.send_recipient_required'));
      return;
    }

    // Check all placeholders have values
    const missingParams = placeholders.filter(key => !paramValues[key]?.trim());
    if (missingParams.length > 0) {
      toast.error(t('whatsapp.send_params_required'));
      return;
    }

    // Build parameters dict (keyed by placeholder index)
    const parameters = placeholders.length > 0 ? paramValues : undefined;

    sendMutation.mutate(
      {
        connectionId,
        request: {
          recipient: recipient.trim(),
          template_name: template.name,
          language_code: template.language,
          parameters,
        },
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success(t('whatsapp.send_success', { name: template.name, recipient: recipient.trim() }));
            // Reset form
            setRecipient('');
            setParamValues({});
            onClose();
          } else {
            toast.error(data.error || t('whatsapp.send_error'));
          }
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.error || t('whatsapp.send_error'));
        },
      }
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('whatsapp.send_template_title')}
      subtitle={template.name}
      maxWidth="lg"
      isLoading={sendMutation.isPending}
      closable={!sendMutation.isPending}
    >
      <div className="space-y-5">
        {/* Template Preview */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            {t('whatsapp.send_preview')}
          </label>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-neutral-800 whitespace-pre-wrap">{previewText}</p>
          </div>
        </div>

        {/* Recipient Phone Number */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('whatsapp.send_recipient')}
          </label>
          <input
            type="tel"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder={t('whatsapp.send_recipient_placeholder')}
            dir="ltr"
          />
          <p className="mt-1 text-xs text-neutral-500">
            {t('whatsapp.send_recipient_hint')}
          </p>
        </div>

        {/* Parameter Inputs */}
        {placeholders.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">
              {t('whatsapp.send_parameters')}
            </label>
            {placeholders.map((key) => (
              <div key={key}>
                <label className="block text-xs text-neutral-500 mb-1">
                  {`{{${key}}}`}
                </label>
                <input
                  type="text"
                  value={paramValues[key] || ''}
                  onChange={(e) => handleParamChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder={t('whatsapp.send_param_placeholder', { index: key })}
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={sendMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={sendMutation.isPending}
          >
            <Send className="w-4 h-4 mr-2" />
            {sendMutation.isPending ? t('whatsapp.sending') : t('whatsapp.send')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
