/**
 * Add Template Modal
 * Modal for creating a new WhatsApp message template.
 * Supports: Header (text/media), Body with variables, Footer, Buttons.
 * Includes a live phone preview showing exactly how the message appears to customers.
 * Reflects Meta's variable format ({{1}}, {{2}}) with auto-detection.
 */

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Plus, Trash2, Link, Phone, MessageSquareReply,
  Image, Video, FileText, Play, CheckCheck, ExternalLink,
} from 'lucide-react';
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
type HeaderType = 'none' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';

const MAX_BUTTONS = 10;

const BUTTON_TYPE_CONFIG: Record<ButtonType, { label: string; icon: typeof Link; color: string }> = {
  URL: { label: 'URL', icon: Link, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  PHONE_NUMBER: { label: 'Phone', icon: Phone, color: 'bg-green-50 text-green-700 border-green-200' },
  QUICK_REPLY: { label: 'Quick Reply', icon: MessageSquareReply, color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const HEADER_OPTIONS: { value: HeaderType; label: string; icon?: typeof Image }[] = [
  { value: 'none', label: 'None' },
  { value: 'TEXT', label: 'Text' },
  { value: 'IMAGE', label: 'Image', icon: Image },
  { value: 'VIDEO', label: 'Video', icon: Video },
  { value: 'DOCUMENT', label: 'Document', icon: FileText },
];

/** Extract {{1}}, {{2}}, etc. from text. Returns sorted unique indices. */
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\d+)\}\}/g);
  if (!matches) return [];
  const unique = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
  unique.sort((a, b) => Number(a) - Number(b));
  return unique;
}

/** Substitute variables in text with example values or highlighted placeholders */
function substituteVariables(text: string, vars: string[], examples: Record<string, string>): string {
  let result = text;
  for (const v of vars) {
    const example = examples[v]?.trim();
    const replacement = example || `{{${v}}}`;
    result = result.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), replacement);
  }
  return result;
}

export function AddTemplateModal({ isOpen, onClose, connectionId }: AddTemplateModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Core fields
  const [templateName, setTemplateName] = useState('my_custom_template');
  const [language, setLanguage] = useState('en_US');
  const [category, setCategory] = useState<'UTILITY' | 'MARKETING' | 'AUTHENTICATION'>('UTILITY');

  // Header
  const [headerType, setHeaderType] = useState<HeaderType>('none');
  const [headerText, setHeaderText] = useState('');
  const [headerExample, setHeaderExample] = useState('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');

  // Body
  const [body, setBody] = useState('Hello! Thank you for contacting us. How can we help you today?');
  const [bodyExamples, setBodyExamples] = useState<Record<string, string>>({});

  // Footer
  const [footer, setFooter] = useState('');

  // Buttons
  const [buttons, setButtons] = useState<CreateTemplateButtonInput[]>([]);

  // Derived: auto-detect body variables
  const bodyVars = useMemo(() => extractVariables(body), [body]);
  const headerHasVar = headerType === 'TEXT' && headerText.includes('{{1}}');

  // ─── Preview computed values ───
  const previewBody = useMemo(
    () => substituteVariables(body, bodyVars, bodyExamples),
    [body, bodyVars, bodyExamples]
  );

  const previewHeader = useMemo(() => {
    if (headerType !== 'TEXT' || !headerText) return '';
    return headerText.replace(/\{\{1\}\}/g, headerExample?.trim() || '{{1}}');
  }, [headerType, headerText, headerExample]);

  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // ─── Mutation ───
  const createMutation = useMutation({
    mutationFn: () => {
      return whatsappService.createTemplate(connectionId, {
        name: templateName,
        language,
        category,
        body,
        header: headerType !== 'none' ? {
          format: headerType,
          text: headerType === 'TEXT' ? headerText : undefined,
          header_example: headerHasVar ? headerExample : undefined,
          media_url: headerType !== 'TEXT' ? headerMediaUrl : undefined,
        } : undefined,
        footer: footer.trim() || undefined,
        body_examples: bodyVars.length > 0
          ? bodyVars.map(v => bodyExamples[v] || '')
          : undefined,
        buttons: buttons.length > 0 ? buttons : undefined,
      });
    },
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

  // ─── Validation ───
  const handleSubmit = () => {
    if (!templateName || !language || !category || !body) {
      toast.error(t('whatsapp.all_fields_required'));
      return;
    }

    // Header validation
    if (headerType === 'TEXT' && !headerText.trim()) {
      toast.error('Header text is required');
      return;
    }
    if (headerHasVar && !headerExample.trim()) {
      toast.error('Example value required for header variable {{1}}');
      return;
    }
    if (headerType !== 'none' && headerType !== 'TEXT' && !headerMediaUrl.trim()) {
      toast.error(`Media URL is required for ${headerType.toLowerCase()} header`);
      return;
    }
    if (headerType !== 'none' && headerType !== 'TEXT' && !headerMediaUrl.startsWith('https://')) {
      toast.error('Media URL must use HTTPS');
      return;
    }

    // Body variable validation
    for (const v of bodyVars) {
      if (!bodyExamples[v]?.trim()) {
        toast.error(`Example value required for body variable {{${v}}}`);
        return;
      }
    }

    // Button validation
    for (const btn of buttons) {
      if (!btn.text.trim()) { toast.error('All buttons must have a label'); return; }
      if (btn.type === 'URL' && !btn.url?.trim()) { toast.error('URL buttons must have a URL'); return; }
      if (btn.type === 'PHONE_NUMBER' && !btn.phone_number?.trim()) { toast.error('Phone buttons must have a number'); return; }
    }

    createMutation.mutate();
  };

  // ─── Button Helpers ───
  const addButton = (type: ButtonType) => {
    if (buttons.length >= MAX_BUTTONS) { toast.error(`Maximum ${MAX_BUTTONS} buttons`); return; }
    const hasQR = buttons.some(b => b.type === 'QUICK_REPLY');
    const hasCTA = buttons.some(b => b.type === 'URL' || b.type === 'PHONE_NUMBER');
    if (type === 'QUICK_REPLY' && hasCTA) { toast.error('Quick Reply cannot be mixed with URL/Phone'); return; }
    if ((type === 'URL' || type === 'PHONE_NUMBER') && hasQR) { toast.error('URL/Phone cannot be mixed with Quick Reply'); return; }
    const urlCount = buttons.filter(b => b.type === 'URL').length;
    const phoneCount = buttons.filter(b => b.type === 'PHONE_NUMBER').length;
    const qrCount = buttons.filter(b => b.type === 'QUICK_REPLY').length;
    if (type === 'URL' && urlCount >= 2) { toast.error('Maximum 2 URL buttons'); return; }
    if (type === 'PHONE_NUMBER' && phoneCount >= 1) { toast.error('Maximum 1 phone button'); return; }
    if (type === 'QUICK_REPLY' && qrCount >= 10) { toast.error('Maximum 10 quick reply buttons'); return; }
    setButtons(prev => [...prev, {
      type, text: '',
      ...(type === 'URL' ? { url: '' } : {}),
      ...(type === 'PHONE_NUMBER' ? { phone_number: '' } : {}),
    }]);
  };

  const updateButton = (i: number, u: Partial<CreateTemplateButtonInput>) =>
    setButtons(prev => prev.map((b, idx) => idx === i ? { ...b, ...u } : b));

  const removeButton = (i: number) => setButtons(prev => prev.filter((_, idx) => idx !== i));

  const hasQR = buttons.some(b => b.type === 'QUICK_REPLY');
  const hasCTA = buttons.some(b => b.type === 'URL' || b.type === 'PHONE_NUMBER');
  const canAddUrl = !hasQR && buttons.filter(b => b.type === 'URL').length < 2;
  const canAddPhone = !hasQR && buttons.filter(b => b.type === 'PHONE_NUMBER').length < 1;
  const canAddQR = !hasCTA && buttons.filter(b => b.type === 'QUICK_REPLY').length < 10;
  const canAddMore = buttons.length < MAX_BUTTONS;

  // ─── Shared input class ───
  const inputClass = 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
  const smallInputClass = 'w-full px-2.5 py-1.5 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  // Check if preview has any content
  const hasPreviewContent = body.trim() || headerType !== 'none' || footer.trim() || buttons.length > 0;

  // CTA buttons (URL, Phone) and Quick Reply buttons render differently
  const ctaButtons = buttons.filter(b => b.type === 'URL' || b.type === 'PHONE_NUMBER');
  const qrButtons = buttons.filter(b => b.type === 'QUICK_REPLY');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('whatsapp.create_template_title')}
      subtitle={t('whatsapp.create_template_subtitle')}
      maxWidth="2xl"
      className="!max-w-5xl"
      isLoading={createMutation.isPending}
      closable={!createMutation.isPending}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ═══════════════════════════════════════ */}
        {/* LEFT PANEL: Form (3/5 columns)         */}
        {/* ═══════════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-5 lg:overflow-y-auto lg:max-h-[65vh] lg:pr-3">

          {/* ── Name / Language / Category ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('whatsapp.template_name')}
              </label>
              <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                className={inputClass} placeholder={t('whatsapp.template_name_placeholder')} />
              <p className="mt-1 text-xs text-neutral-500">{t('whatsapp.template_name_hint')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('whatsapp.language')}</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
                <option value="en_US">{t('whatsapp.language_en_us')}</option>
                <option value="en_GB">{t('whatsapp.language_en_gb')}</option>
                <option value="ar">{t('whatsapp.language_ar')}</option>
                <option value="es">{t('whatsapp.language_es')}</option>
                <option value="fr">{t('whatsapp.language_fr')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('whatsapp.category')}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className={inputClass}>
                <option value="UTILITY">{t('whatsapp.category_utility')}</option>
                <option value="MARKETING">{t('whatsapp.category_marketing')}</option>
                <option value="AUTHENTICATION">{t('whatsapp.category_authentication')}</option>
              </select>
            </div>
          </div>

          {/* ── Header ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Header <span className="text-xs font-normal text-neutral-400">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {HEADER_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => { setHeaderType(value); setHeaderText(''); setHeaderExample(''); setHeaderMediaUrl(''); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    headerType === value
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {headerType === 'TEXT' && (
              <div className="space-y-2">
                <input type="text" value={headerText} onChange={(e) => setHeaderText(e.target.value)}
                  maxLength={60} className={inputClass}
                  placeholder="e.g., Hello {{1}}!" />
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Supports one {'{{1}}'} variable</span>
                  <span>{headerText.length}/60</span>
                </div>
                {headerHasVar && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="block text-xs font-medium text-amber-800 mb-1">Example for {'{{1}}'}:</label>
                    <input type="text" value={headerExample} onChange={(e) => setHeaderExample(e.target.value)}
                      className={smallInputClass} placeholder="e.g., John" />
                  </div>
                )}
              </div>
            )}

            {headerType !== 'none' && headerType !== 'TEXT' && (
              <div>
                <input type="url" value={headerMediaUrl} onChange={(e) => setHeaderMediaUrl(e.target.value)}
                  className={inputClass}
                  placeholder={`https://example.com/${headerType === 'IMAGE' ? 'image.jpg' : headerType === 'VIDEO' ? 'video.mp4' : 'document.pdf'}`} />
                <p className="mt-1 text-xs text-neutral-400">Publicly accessible HTTPS URL</p>
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('whatsapp.message_body')}
            </label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
              className={`${inputClass} font-mono`}
              placeholder={t('whatsapp.message_body_placeholder')} />
            <div className="flex justify-between text-xs text-neutral-400 mt-1">
              <span>Use {'{{1}}'}, {'{{2}}'} for variables</span>
              <span>{body.length}/1024</span>
            </div>

            {/* Auto-detected variables */}
            {bodyVars.length > 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2.5">
                <p className="text-xs font-medium text-blue-800">
                  Variables detected: {bodyVars.map(v => `{{${v}}}`).join(', ')}
                </p>
                {bodyVars.map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-700 w-10 shrink-0">{`{{${v}}}`}</span>
                    <input type="text" value={bodyExamples[v] || ''}
                      onChange={(e) => setBodyExamples(prev => ({ ...prev, [v]: e.target.value }))}
                      className={`${smallInputClass} bg-white`}
                      placeholder={v === '1' ? 'e.g., John' : v === '2' ? 'e.g., 12345' : `example for {{${v}}}`} />
                  </div>
                ))}
                <p className="text-xs text-blue-600">Meta requires example values for template approval.</p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Footer <span className="text-xs font-normal text-neutral-400">(optional)</span>
            </label>
            <input type="text" value={footer} onChange={(e) => setFooter(e.target.value)} maxLength={60}
              className={inputClass} placeholder="e.g., Reply STOP to unsubscribe" />
            <div className="flex justify-between text-xs text-neutral-400 mt-1">
              <span>Plain text, no variables</span>
              <span>{footer.length}/60</span>
            </div>
          </div>

          {/* ── Buttons ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-700">
                Buttons <span className="text-xs font-normal text-neutral-400">(optional)</span>
              </label>
              {buttons.length > 0 && (
                <span className="text-xs text-neutral-400">{buttons.length}/{hasQR ? 10 : 3}</span>
              )}
            </div>

            {buttons.length > 0 && (
              <div className="space-y-2 mb-3">
                {buttons.map((btn, i) => {
                  const cfg = BUTTON_TYPE_CONFIG[btn.type];
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className={`border rounded-lg p-2.5 ${cfg.color}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{cfg.label}</span>
                        </div>
                        <button type="button" onClick={() => removeButton(i)}
                          className="p-0.5 rounded hover:bg-black/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <input type="text" value={btn.text} onChange={(e) => updateButton(i, { text: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-sm border border-current/20 rounded-md bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-current/40"
                          placeholder="Button label" maxLength={25} />
                        {btn.type === 'URL' && (
                          <input type="url" value={btn.url || ''} onChange={(e) => updateButton(i, { url: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm border border-current/20 rounded-md bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-current/40"
                            placeholder="https://example.com" />
                        )}
                        {btn.type === 'PHONE_NUMBER' && (
                          <input type="tel" value={btn.phone_number || ''} onChange={(e) => updateButton(i, { phone_number: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm border border-current/20 rounded-md bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-current/40"
                            placeholder="+1234567890" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {canAddMore && (canAddUrl || canAddPhone || canAddQR) && (
              <div className="flex flex-wrap gap-1.5">
                {canAddUrl && (
                  <button type="button" onClick={() => addButton('URL')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                    <Plus className="w-3 h-3" /> URL
                  </button>
                )}
                {canAddPhone && (
                  <button type="button" onClick={() => addButton('PHONE_NUMBER')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                    <Plus className="w-3 h-3" /> Phone
                  </button>
                )}
                {canAddQR && (
                  <button type="button" onClick={() => addButton('QUICK_REPLY')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                    <Plus className="w-3 h-3" /> Quick Reply
                  </button>
                )}
              </div>
            )}

            {buttons.length > 0 && (hasQR || hasCTA) && (
              <p className="mt-1.5 text-xs text-neutral-400">
                {hasQR ? `Quick Reply (${buttons.length}/10) — cannot mix with URL/Phone` : `CTA — max 2 URL + 1 Phone`}
              </p>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button variant="ghost" onClick={onClose} disabled={createMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? t('whatsapp.creating') : t('whatsapp.submit')}
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* RIGHT PANEL: Live Preview (2/5 cols)   */}
        {/* ═══════════════════════════════════════ */}
        <div className="hidden lg:flex lg:col-span-2 flex-col">
          <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
            Preview
          </label>

          {/* Phone mockup */}
          <div className="bg-neutral-800 rounded-[2rem] p-2 shadow-xl flex-1 flex flex-col max-h-[65vh]">
            {/* Screen */}
            <div className="bg-white rounded-[1.5rem] overflow-hidden flex flex-col flex-1">
              {/* WhatsApp top bar */}
              <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">W</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-tight">WhatsApp</p>
                  <p className="text-white/60 text-[10px]">online</p>
                </div>
              </div>

              {/* Chat area */}
              <div className="bg-[#E5DDD5] flex-1 p-4 overflow-y-auto flex flex-col justify-end">
                {hasPreviewContent ? (
                  <div className="max-w-[92%]">
                    {/* Message bubble */}
                    <div className="bg-white rounded-tl-lg rounded-tr-lg rounded-br-lg rounded-bl-sm shadow-sm overflow-hidden">

                      {/* Header: Media placeholder */}
                      {headerType === 'IMAGE' && (
                        <div className="bg-[#E8F0FE] h-36 flex flex-col items-center justify-center gap-1.5">
                          <Image className="w-8 h-8 text-[#90A4AE]" />
                          <span className="text-[11px] text-[#90A4AE] font-medium">Image</span>
                        </div>
                      )}
                      {headerType === 'VIDEO' && (
                        <div className="bg-neutral-900 h-36 flex flex-col items-center justify-center gap-1.5 relative">
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white fill-white" />
                          </div>
                          <span className="text-[11px] text-white/60 font-medium">Video</span>
                        </div>
                      )}
                      {headerType === 'DOCUMENT' && (
                        <div className="bg-[#F5F5F5] px-3 py-3 flex items-center gap-2.5 border-b border-neutral-200">
                          <div className="w-10 h-10 rounded bg-[#E53935] flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-800 truncate">Document</p>
                            <p className="text-[10px] text-neutral-400">PDF</p>
                          </div>
                        </div>
                      )}

                      {/* Text content area */}
                      <div className="px-2.5 pt-1.5 pb-1">
                        {/* Header: Text */}
                        {headerType === 'TEXT' && previewHeader && (
                          <p className="font-semibold text-[13px] text-neutral-900 leading-snug mb-1">
                            {previewHeader}
                          </p>
                        )}

                        {/* Body */}
                        {previewBody && (
                          <p className="text-[13px] text-neutral-800 whitespace-pre-wrap leading-relaxed">
                            {previewBody}
                          </p>
                        )}

                        {/* Footer + Timestamp row */}
                        <div className="flex items-end justify-between gap-3 mt-0.5">
                          {footer.trim() ? (
                            <p className="text-[11px] text-neutral-400 leading-snug">{footer}</p>
                          ) : (
                            <span />
                          )}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <span className="text-[10px] text-neutral-400">{currentTime}</span>
                            <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA Buttons (URL / Phone) — outside bubble */}
                    {ctaButtons.length > 0 && (
                      <div className="mt-1 space-y-[1px]">
                        {ctaButtons.map((btn, i) => (
                          <div key={i}
                            className="bg-white flex items-center justify-center gap-1.5 py-2 first:rounded-t-none last:rounded-b-lg shadow-sm">
                            {btn.type === 'URL' ? (
                              <ExternalLink className="w-3.5 h-3.5 text-[#00A5F4]" />
                            ) : (
                              <Phone className="w-3.5 h-3.5 text-[#00A5F4]" />
                            )}
                            <span className="text-[13px] font-medium text-[#00A5F4]">
                              {btn.text || (btn.type === 'URL' ? 'Visit Website' : 'Call')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Reply Buttons — outside bubble, row layout */}
                    {qrButtons.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {qrButtons.map((btn, i) => (
                          <div key={i}
                            className="bg-white rounded-lg shadow-sm px-3 py-1.5 flex items-center justify-center">
                            <span className="text-[12px] font-medium text-[#00A5F4]">
                              {btn.text || 'Reply'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-[11px] text-neutral-400 italic">Start typing to see preview</p>
                  </div>
                )}
              </div>

              {/* Bottom bar (input simulation) */}
              <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2 shrink-0">
                <div className="flex-1 bg-white rounded-full px-3 py-1.5">
                  <span className="text-[11px] text-neutral-400">Type a message</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#075E54] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.239 1.816-13.239 1.817-.011 7.912z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
