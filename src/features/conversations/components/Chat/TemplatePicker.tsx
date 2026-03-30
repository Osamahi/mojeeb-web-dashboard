/**
 * Template Picker
 * Inline panel for selecting and sending WhatsApp template messages.
 */

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, Send, ChevronLeft, ChevronRight, Loader2, LayoutTemplate, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWhatsAppTemplates, useSendTemplateInConversation } from '@/features/whatsapp/hooks/useWhatsAppTemplates';
import type { MessageTemplate } from '@/features/whatsapp/types/whatsapp.types';

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  connectionId: string;
}

function extractPlaceholders(template: MessageTemplate): string[] {
  const bodyComponent = template.components?.find((c) => c.type === 'BODY');
  const text = bodyComponent?.text || '';
  const matches = text.match(/\{\{(\d+)\}\}/g);
  if (!matches) return [];
  const unique = [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))];
  unique.sort((a, b) => Number(a) - Number(b));
  return unique;
}

export default function TemplatePicker({
  isOpen,
  onClose,
  conversationId,
  connectionId,
}: TemplatePickerProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  const { data: templates, isLoading: templatesLoading } = useWhatsAppTemplates(connectionId);
  const sendMutation = useSendTemplateInConversation();

  const approvedTemplates = useMemo(
    () => templates?.filter((tpl) => tpl.status === 'APPROVED') ?? [],
    [templates]
  );

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplate(null);
      setParamValues({});
    }
  }, [isOpen]);

  const placeholders = useMemo(
    () => (selectedTemplate ? extractPlaceholders(selectedTemplate) : []),
    [selectedTemplate]
  );

  const bodyText = useMemo(
    () => selectedTemplate?.components?.find((c) => c.type === 'BODY')?.text || '',
    [selectedTemplate]
  );

  const previewText = useMemo(() => {
    let text = bodyText;
    for (const key of placeholders) {
      const value = paramValues[key] || `{{${key}}}`;
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return text;
  }, [bodyText, placeholders, paramValues]);

  const handleSend = () => {
    if (!selectedTemplate) return;

    const missingParams = placeholders.filter((key) => !paramValues[key]?.trim());
    if (missingParams.length > 0) {
      toast.error(t('whatsapp.send_params_required', 'Please fill in all template parameters'));
      return;
    }

    sendMutation.mutate(
      {
        conversation_id: conversationId,
        template_name: selectedTemplate.name,
        language_code: selectedTemplate.language,
        parameters: placeholders.length > 0 ? paramValues : undefined,
        template_body: previewText,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success(t('whatsapp.template_sent_in_chat', 'Template sent successfully'));
            onClose();
          } else {
            toast.error(data.error || t('whatsapp.send_error', 'Failed to send template'));
          }
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.error || t('whatsapp.send_error', 'Failed to send template'));
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="overflow-hidden border-t border-neutral-200 bg-white"
        >
          <div className="max-h-[340px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                {selectedTemplate ? (
                  <button
                    onClick={() => { setSelectedTemplate(null); setParamValues({}); }}
                    className="p-1 hover:bg-neutral-100 rounded transition-colors"
                  >
                    {isRTL
                      ? <ChevronRight className="w-4 h-4 text-neutral-600" />
                      : <ChevronLeft className="w-4 h-4 text-neutral-600" />
                    }
                  </button>
                ) : (
                  <LayoutTemplate className="w-4 h-4 text-neutral-500" />
                )}
                <span className="text-sm font-medium text-neutral-800">
                  {selectedTemplate
                    ? selectedTemplate.name.replace(/_/g, ' ')
                    : t('whatsapp.select_template', 'Select Template')}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            {!selectedTemplate ? (
              /* Template List */
              <div className="flex-1 overflow-y-auto px-2 py-1.5 min-h-[80px] max-h-[280px]">
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                  </div>
                ) : approvedTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-6 gap-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                      <LayoutTemplate className="w-6 h-6 text-neutral-400" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-neutral-700">
                        {t('whatsapp.no_templates_title', 'No templates yet')}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {t('whatsapp.no_templates_desc', 'Create a template in WhatsApp Management to start messaging customers.')}
                      </p>
                    </div>
                    <button
                      onClick={() => { onClose(); navigate('/whatsapp-management'); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-mojeeb text-white hover:bg-brand-mojeeb-hover transition-colors"
                    >
                      {t('whatsapp.create_template_link', 'Create a template')}
                    </button>
                  </div>
                ) : (
                  <>
                    {approvedTemplates.map((tpl) => {
                      const body = tpl.components?.find((c) => c.type === 'BODY')?.text || '';
                      return (
                        <button
                          key={tpl.id}
                          onClick={() => { setSelectedTemplate(tpl); setParamValues({}); }}
                          className={cn(
                            'w-full text-start px-3 py-2.5 rounded-lg',
                            'hover:bg-neutral-50 transition-colors',
                            'border border-neutral-100 mb-1.5'
                          )}
                        >
                          <span className="text-sm font-medium text-neutral-800">
                            {tpl.name.replace(/_/g, ' ')}
                          </span>
                          <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                            {body}
                          </p>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => { onClose(); navigate('/whatsapp-management'); }}
                      className={cn(
                        'w-full text-start px-3 py-2.5 rounded-lg',
                        'hover:bg-neutral-50 transition-colors',
                        'border border-dashed border-neutral-200 mb-1.5'
                      )}
                    >
                      <span className="text-sm font-medium text-neutral-500">
                        {t('connections.manage_templates', 'Manage Templates')}
                      </span>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {t('whatsapp.manage_templates_desc', 'Create, edit, or view all templates')}
                      </p>
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* Template Detail + Send */
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[280px]">
                {/* Preview */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                  <p className="text-sm text-neutral-800 whitespace-pre-wrap">
                    {previewText}
                  </p>
                </div>

                {/* Parameter Inputs */}
                {placeholders.length > 0 && (
                  <div className="space-y-2">
                    {placeholders.map((key) => (
                      <input
                        key={key}
                        type="text"
                        value={paramValues[key] || ''}
                        onChange={(e) =>
                          setParamValues((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-lg focus:ring-1 focus:ring-green-400 focus:border-transparent"
                        placeholder={`{{${key}}}`}
                      />
                    ))}
                  </div>
                )}

                {/* Send */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSend}
                    disabled={sendMutation.isPending}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium',
                      'bg-green-600 text-white hover:bg-green-700 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {sendMutation.isPending
                      ? t('whatsapp.sending', 'Sending...')
                      : t('whatsapp.send', 'Send')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
