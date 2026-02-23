/**
 * Add Template Modal
 * Modal for creating a new WhatsApp message template.
 * Supports: Header (text/media upload), Body with variables, Footer, Buttons.
 * Includes a live phone preview showing exactly how the message appears to customers.
 * Reflects Meta's variable format ({{1}}, {{2}}) with auto-detection.
 */

import { useState, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Plus, Trash2, Link, Phone, MessageSquareReply,
  Image, Video, FileText, Play, CheckCheck, ExternalLink,
  Upload, X, Loader2,
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
const MAX_MEDIA_SIZE_MB = 16;
const MAX_MEDIA_SIZE_BYTES = MAX_MEDIA_SIZE_MB * 1024 * 1024;

/** Allowed MIME types per header type */
const MEDIA_ACCEPT: Record<'IMAGE' | 'VIDEO' | 'DOCUMENT', string> = {
  IMAGE: 'image/jpeg,image/png',
  VIDEO: 'video/mp4',
  DOCUMENT: 'application/pdf',
};

/** Human-readable file type labels */
const MEDIA_TYPE_LABELS: Record<'IMAGE' | 'VIDEO' | 'DOCUMENT', string> = {
  IMAGE: 'JPG or PNG',
  VIDEO: 'MP4',
  DOCUMENT: 'PDF',
};

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

/** Detect if text starts with RTL characters (Arabic, Hebrew, Urdu, Farsi, etc.) */
function isRtlText(text: string): boolean {
  // Strip variables like {{1}} and whitespace, then check first real character
  const stripped = text.replace(/\{\{\d+\}\}/g, '').trim();
  if (!stripped) return false;
  // Unicode ranges for RTL scripts
  return /^[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(stripped);
}

/** Format file size for display */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AddTemplateModal({ isOpen, onClose, connectionId }: AddTemplateModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core fields
  const [templateName, setTemplateName] = useState('my_custom_template');
  const [templateNameError, setTemplateNameError] = useState('');
  const [language, setLanguage] = useState('en_US');
  const [category, setCategory] = useState<'UTILITY' | 'MARKETING' | 'AUTHENTICATION'>('UTILITY');

  // Header
  const [headerType, setHeaderType] = useState<HeaderType>('none');
  const [headerText, setHeaderText] = useState('');
  const [headerExample, setHeaderExample] = useState('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');

  // Media upload state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');

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

  // Header option labels (translated)
  const headerOptionLabels: Record<HeaderType, string> = {
    none: t('whatsapp.header_none'),
    TEXT: t('whatsapp.header_text'),
    IMAGE: t('whatsapp.header_image'),
    VIDEO: t('whatsapp.header_video'),
    DOCUMENT: t('whatsapp.header_document'),
  };

  // Button type config (translated)
  const buttonTypeConfig: Record<ButtonType, { label: string; icon: typeof Link; color: string }> = {
    URL: { label: t('whatsapp.button_url'), icon: Link, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    PHONE_NUMBER: { label: t('whatsapp.button_phone'), icon: Phone, color: 'bg-green-50 text-green-700 border-green-200' },
    QUICK_REPLY: { label: t('whatsapp.button_quick_reply'), icon: MessageSquareReply, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  // ─── Upload Mutation ───
  const uploadMutation = useMutation({
    mutationFn: (file: File) => whatsappService.uploadTemplateMedia(connectionId, file),
    onSuccess: (data) => {
      setHeaderMediaUrl(data.handle);
      toast.success(t('whatsapp.upload_success'));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || t('whatsapp.upload_error'));
      // Clear the file on error
      clearMediaFile();
    },
  });

  // ─── Media file helpers ───
  const clearMediaFile = () => {
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaFile(null);
    setMediaPreviewUrl('');
    setHeaderMediaUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      toast.error(t('whatsapp.upload_file_too_large', { size: MAX_MEDIA_SIZE_MB }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate MIME type for current header type
    if (headerType === 'IMAGE' || headerType === 'VIDEO' || headerType === 'DOCUMENT') {
      const acceptedTypes = MEDIA_ACCEPT[headerType].split(',');
      if (!acceptedTypes.includes(file.type)) {
        toast.error(t('whatsapp.upload_invalid_type', { types: MEDIA_TYPE_LABELS[headerType] }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    // Clear previous preview URL
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);

    // Set file and create local preview URL (for images)
    setMediaFile(file);
    if (file.type.startsWith('image/')) {
      setMediaPreviewUrl(URL.createObjectURL(file));
    } else {
      setMediaPreviewUrl('');
    }

    // Trigger upload
    uploadMutation.mutate(file);
  };

  const handleHeaderTypeChange = (value: HeaderType) => {
    setHeaderType(value);
    setHeaderText('');
    setHeaderExample('');
    setHeaderMediaUrl('');
    clearMediaFile();
  };

  // ─── Create Mutation ───
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

    // Template name format validation
    if (!/^[a-z][a-z0-9_]*$/.test(templateName)) {
      toast.error(t('whatsapp.template_name_format_error'));
      return;
    }

    // Header validation
    if (headerType === 'TEXT' && !headerText.trim()) {
      toast.error(t('whatsapp.header_text_required'));
      return;
    }
    if (headerHasVar && !headerExample.trim()) {
      toast.error(t('whatsapp.header_example_required'));
      return;
    }
    if (headerType !== 'none' && headerType !== 'TEXT' && !headerMediaUrl.trim()) {
      toast.error(t('whatsapp.header_media_required', { type: headerType.toLowerCase() }));
      return;
    }

    // Body variable validation
    for (const v of bodyVars) {
      if (!bodyExamples[v]?.trim()) {
        toast.error(t('whatsapp.body_variable_required', { var: `{{${v}}}` }));
        return;
      }
    }

    // Button validation
    for (const btn of buttons) {
      if (!btn.text.trim()) { toast.error(t('whatsapp.button_label_required')); return; }
      if (btn.type === 'URL' && !btn.url?.trim()) { toast.error(t('whatsapp.button_url_required')); return; }
      if (btn.type === 'PHONE_NUMBER' && !btn.phone_number?.trim()) { toast.error(t('whatsapp.button_phone_required')); return; }
    }

    createMutation.mutate();
  };

  // ─── Button Helpers ───
  const addButton = (type: ButtonType) => {
    if (buttons.length >= MAX_BUTTONS) { toast.error(t('whatsapp.button_max_reached', { max: MAX_BUTTONS })); return; }
    const hasQR = buttons.some(b => b.type === 'QUICK_REPLY');
    const hasCTA = buttons.some(b => b.type === 'URL' || b.type === 'PHONE_NUMBER');
    if (type === 'QUICK_REPLY' && hasCTA) { toast.error(t('whatsapp.button_no_mix_qr')); return; }
    if ((type === 'URL' || type === 'PHONE_NUMBER') && hasQR) { toast.error(t('whatsapp.button_no_mix_cta')); return; }
    const urlCount = buttons.filter(b => b.type === 'URL').length;
    const phoneCount = buttons.filter(b => b.type === 'PHONE_NUMBER').length;
    const qrCount = buttons.filter(b => b.type === 'QUICK_REPLY').length;
    if (type === 'URL' && urlCount >= 2) { toast.error(t('whatsapp.button_max_url')); return; }
    if (type === 'PHONE_NUMBER' && phoneCount >= 1) { toast.error(t('whatsapp.button_max_phone')); return; }
    if (type === 'QUICK_REPLY' && qrCount >= 10) { toast.error(t('whatsapp.button_max_qr')); return; }
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

  // Is any async operation in progress?
  const isProcessing = createMutation.isPending || uploadMutation.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('whatsapp.create_template_title')}
      subtitle={t('whatsapp.create_template_subtitle')}
      maxWidth="2xl"
      className="!max-w-5xl"
      isLoading={isProcessing}
      closable={!isProcessing}
    >
      <div className="lg:flex lg:gap-6" style={{ height: '560px' }}>

        {/* ═══════════════════════════════════════ */}
        {/* LEFT PANEL: Form + Actions              */}
        {/* ═══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex-1 min-h-0 overflow-y-auto space-y-5 lg:pr-3 pb-1">

          {/* ── Name / Language / Category ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('whatsapp.template_name')}
              </label>
              <input type="text" value={templateName}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Sanitize: only allow lowercase letters, numbers, underscores
                  const sanitized = raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setTemplateName(sanitized);
                  // Show feedback if characters were stripped
                  if (raw !== sanitized) {
                    setTemplateNameError(t('whatsapp.template_name_char_error'));
                  } else {
                    setTemplateNameError('');
                  }
                }}
                className={`${inputClass} ${templateNameError ? '!border-amber-400 !ring-amber-100' : ''}`}
                placeholder={t('whatsapp.template_name_placeholder')} />
              {templateNameError ? (
                <p className="mt-1 text-xs text-amber-600">{templateNameError}</p>
              ) : (
                <p className="mt-1 text-xs text-neutral-500">{t('whatsapp.template_name_hint')}</p>
              )}
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
              {t('whatsapp.header')} <span className="text-xs font-normal text-neutral-400">({t('whatsapp.optional')})</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(['none', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] as HeaderType[]).map((value) => (
                <button key={value} type="button" onClick={() => handleHeaderTypeChange(value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    headerType === value
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                  }`}>
                  {headerOptionLabels[value]}
                </button>
              ))}
            </div>

            {headerType === 'TEXT' && (
              <div className="space-y-2">
                <input type="text" value={headerText} onChange={(e) => setHeaderText(e.target.value)}
                  maxLength={60} className={inputClass}
                  placeholder={t('whatsapp.header_text_placeholder')} />
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>{t('whatsapp.header_supports_variable')}</span>
                  <span>{headerText.length}/60</span>
                </div>
                {headerHasVar && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="block text-xs font-medium text-amber-800 mb-1">{t('whatsapp.header_example_label')}</label>
                    <input type="text" value={headerExample} onChange={(e) => setHeaderExample(e.target.value)}
                      className={smallInputClass} placeholder={t('whatsapp.header_example_placeholder')} />
                  </div>
                )}
              </div>
            )}

            {/* Media Upload Area (IMAGE / VIDEO / DOCUMENT) */}
            {headerType !== 'none' && headerType !== 'TEXT' && (
              <div>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={MEDIA_ACCEPT[headerType]}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!mediaFile ? (
                  /* Upload zone — click to browse */
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-5 text-center
                      hover:border-neutral-400 hover:bg-neutral-50 transition-colors cursor-pointer
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600 font-medium">
                      {t('whatsapp.upload_click')}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {t('whatsapp.upload_max_size', { size: MAX_MEDIA_SIZE_MB })} &middot; {MEDIA_TYPE_LABELS[headerType]}
                    </p>
                  </button>
                ) : (
                  /* Uploaded file display */
                  <div className={`border rounded-lg p-3 ${
                    uploadMutation.isPending
                      ? 'border-blue-200 bg-blue-50'
                      : headerMediaUrl
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      {/* File icon or image preview */}
                      {mediaPreviewUrl && headerType === 'IMAGE' ? (
                        <img
                          src={mediaPreviewUrl}
                          alt="Preview"
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          headerType === 'VIDEO' ? 'bg-neutral-800' : 'bg-red-500'
                        }`}>
                          {headerType === 'VIDEO' ? (
                            <Play className="w-4 h-4 text-white fill-white" />
                          ) : (
                            <FileText className="w-4 h-4 text-white" />
                          )}
                        </div>
                      )}

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">
                          {mediaFile.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatFileSize(mediaFile.size)}
                          {uploadMutation.isPending && (
                            <span className="text-blue-600 ml-1.5">{t('whatsapp.upload_uploading')}</span>
                          )}
                          {headerMediaUrl && !uploadMutation.isPending && (
                            <span className="text-green-600 ml-1.5">{t('whatsapp.upload_uploaded')}</span>
                          )}
                        </p>
                      </div>

                      {/* Loading spinner or remove button */}
                      {uploadMutation.isPending ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
                      ) : (
                        <button
                          type="button"
                          onClick={clearMediaFile}
                          className="p-1 rounded-full hover:bg-black/10 transition-colors shrink-0"
                          title="Remove file"
                        >
                          <X className="w-4 h-4 text-neutral-500" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
              <span>{t('whatsapp.body_variable_hint')}</span>
              <span>{body.length}/1024</span>
            </div>

            {/* Auto-detected variables */}
            {bodyVars.length > 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2.5">
                <p className="text-xs font-medium text-blue-800">
                  {t('whatsapp.body_variables_detected')} {bodyVars.map(v => `{{${v}}}`).join(', ')}
                </p>
                {bodyVars.map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-700 w-10 shrink-0">{`{{${v}}}`}</span>
                    <input type="text" value={bodyExamples[v] || ''}
                      onChange={(e) => setBodyExamples(prev => ({ ...prev, [v]: e.target.value }))}
                      className={`${smallInputClass} bg-white`}
                      placeholder={
                        v === '1' ? t('whatsapp.body_variable_example_placeholder_1')
                        : v === '2' ? t('whatsapp.body_variable_example_placeholder_2')
                        : t('whatsapp.body_variable_example_placeholder', { var: `{{${v}}}` })
                      } />
                  </div>
                ))}
                <p className="text-xs text-blue-600">{t('whatsapp.body_meta_example_note')}</p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('whatsapp.footer')} <span className="text-xs font-normal text-neutral-400">({t('whatsapp.optional')})</span>
            </label>
            <input type="text" value={footer} onChange={(e) => setFooter(e.target.value)} maxLength={60}
              className={inputClass} placeholder={t('whatsapp.footer_placeholder')} />
            <div className="flex justify-between text-xs text-neutral-400 mt-1">
              <span>{t('whatsapp.footer_hint')}</span>
              <span>{footer.length}/60</span>
            </div>
          </div>

          {/* ── Buttons ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-700">
                {t('whatsapp.buttons')} <span className="text-xs font-normal text-neutral-400">({t('whatsapp.optional')})</span>
              </label>
              {buttons.length > 0 && (
                <span className="text-xs text-neutral-400">{buttons.length}/{hasQR ? 10 : 3}</span>
              )}
            </div>

            {buttons.length > 0 && (
              <div className="space-y-2 mb-3">
                {buttons.map((btn, i) => {
                  const cfg = buttonTypeConfig[btn.type];
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
                          placeholder={t('whatsapp.button_label_placeholder')} maxLength={25} />
                        {btn.type === 'URL' && (
                          <input type="url" value={btn.url || ''} onChange={(e) => updateButton(i, { url: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm border border-current/20 rounded-md bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-current/40"
                            placeholder={t('whatsapp.button_url_placeholder')} />
                        )}
                        {btn.type === 'PHONE_NUMBER' && (
                          <input type="tel" value={btn.phone_number || ''} onChange={(e) => updateButton(i, { phone_number: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm border border-current/20 rounded-md bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-current/40"
                            placeholder={t('whatsapp.button_phone_placeholder')} />
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
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                    <Plus className="w-3 h-3" /> {t('whatsapp.button_url')}
                  </button>
                )}
                {canAddPhone && (
                  <button type="button" onClick={() => addButton('PHONE_NUMBER')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                    <Plus className="w-3 h-3" /> {t('whatsapp.button_phone')}
                  </button>
                )}
                {canAddQR && (
                  <button type="button" onClick={() => addButton('QUICK_REPLY')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                    <Plus className="w-3 h-3" /> {t('whatsapp.button_quick_reply')}
                  </button>
                )}
              </div>
            )}

            {buttons.length > 0 && (hasQR || hasCTA) && (
              <p className="mt-1.5 text-xs text-neutral-400">
                {hasQR ? t('whatsapp.button_qr_hint', { count: buttons.length }) : t('whatsapp.button_cta_hint')}
              </p>
            )}
          </div>

        </div>

          {/* ── Actions (pinned to bottom of left column) ── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 shrink-0">
            <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isProcessing}>
              {createMutation.isPending ? t('whatsapp.creating') : t('whatsapp.submit')}
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* RIGHT PANEL: Live Preview (2/5 cols)   */}
        {/* ═══════════════════════════════════════ */}
        <div className="hidden lg:flex flex-col items-center shrink-0">

          {/* Phone mockup — mobile dimensions with drop shadow, no black frame */}
          <div className="relative w-[280px]">
            {/* Outer container with sleek drop shadow */}
            <div className="bg-white rounded-[2rem] overflow-hidden flex flex-col shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06]"
              style={{ height: '540px' }}>

              {/* WhatsApp header bar */}
              <div className="bg-[#075E54] px-4 pb-2.5 pt-3 flex items-center gap-2.5 shrink-0">
                <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-300 to-neutral-400 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] font-medium leading-tight truncate">{t('whatsapp.preview_customer')}</p>
                  <p className="text-white/50 text-[10px]">{t('whatsapp.preview_online')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 24 24"><path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3V6c0-1.654 1.346-3 3-3s3 1.346 3 3v6zm-2 0V6c0-.551-.449-1-1-1s-1 .449-1 1v6c0 .551.449 1 1 1s1-.449 1-1zm4 0h2a7.003 7.003 0 01-6 6.93V22h-2v-3.07A7.003 7.003 0 015 12h2a5 5 0 1010 0z" /></svg>
                  <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                </div>
              </div>

              {/* Chat area — WhatsApp wallpaper */}
              <div
                className="flex-1 p-3 overflow-y-auto flex flex-col justify-end"
                style={{ backgroundColor: '#ECE5DD', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23d4cfc6\' fill-opacity=\'0.4\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1.5\'/%3E%3Ccircle cx=\'90\' cy=\'60\' r=\'1\'/%3E%3Ccircle cx=\'150\' cy=\'25\' r=\'1.5\'/%3E%3Ccircle cx=\'60\' cy=\'120\' r=\'1\'/%3E%3Ccircle cx=\'170\' cy=\'100\' r=\'1.5\'/%3E%3Ccircle cx=\'40\' cy=\'170\' r=\'1\'/%3E%3Ccircle cx=\'130\' cy=\'160\' r=\'1.5\'/%3E%3C/g%3E%3C/svg%3E")' }}
              >
                {hasPreviewContent ? (
                  <div className="max-w-[95%]">
                    {/* Message bubble */}
                    <div className="bg-white rounded-[10px] rounded-tl-[3px] shadow-[0_1px_1px_rgba(0,0,0,0.06)] overflow-hidden">

                      {/* Header: Image — WhatsApp uses 1.91:1 aspect ratio, center-cropped */}
                      {headerType === 'IMAGE' && (
                        mediaPreviewUrl ? (
                          <div className="m-1 rounded-lg overflow-hidden" style={{ aspectRatio: '1.91 / 1' }}>
                            <img
                              src={mediaPreviewUrl}
                              alt="Header preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="bg-gradient-to-br from-neutral-100 to-neutral-200 m-1 rounded-lg flex flex-col items-center justify-center gap-1"
                            style={{ aspectRatio: '1.91 / 1' }}
                          >
                            <div className="w-10 h-10 rounded-full bg-white/70 backdrop-blur flex items-center justify-center">
                              <Image className="w-5 h-5 text-neutral-400" />
                            </div>
                            <span className="text-[10px] text-neutral-400 font-medium">{t('whatsapp.preview_image')}</span>
                          </div>
                        )
                      )}

                      {/* Header: Video — same 1.91:1 aspect ratio as image */}
                      {headerType === 'VIDEO' && (
                        <div
                          className="bg-gradient-to-br from-neutral-800 to-neutral-900 m-1 rounded-lg flex flex-col items-center justify-center gap-1"
                          style={{ aspectRatio: '1.91 / 1' }}
                        >
                          <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                          <span className="text-[10px] text-white/40 font-medium">
                            {mediaFile?.name || t('whatsapp.preview_video')}
                          </span>
                        </div>
                      )}

                      {/* Header: Document — show filename if uploaded */}
                      {headerType === 'DOCUMENT' && (
                        <div className="bg-[#F7F8FA] m-1 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium text-neutral-800 truncate">
                              {mediaFile?.name || t('whatsapp.preview_document')}
                            </p>
                            <p className="text-[10px] text-neutral-400">
                              {mediaFile ? formatFileSize(mediaFile.size) : 'PDF'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Text content area */}
                      <div className="px-2 pt-1 pb-[3px]">
                        {/* Header: Text — dir="auto" for RTL/LTR detection like WhatsApp */}
                        {headerType === 'TEXT' && previewHeader && (
                          <p dir="auto" className="font-semibold text-[13px] text-neutral-900 leading-snug mb-0.5">
                            {previewHeader}
                          </p>
                        )}

                        {/* Body — dir="auto" for RTL/LTR detection like WhatsApp */}
                        {previewBody && (
                          <p dir="auto" className="text-[13px] text-[#111B21] whitespace-pre-wrap leading-[1.35rem]">
                            {previewBody}
                          </p>
                        )}

                        {/* Footer + Timestamp row */}
                        <div className={`flex items-end justify-between gap-3 mt-[2px] ${isRtlText(footer) ? 'flex-row-reverse' : ''}`}>
                          {footer.trim() ? (
                            <p dir="auto" className="text-[11px] text-[#8696A0] leading-snug">{footer}</p>
                          ) : (
                            <span />
                          )}
                          <div className="flex items-center gap-[3px] shrink-0 pb-[1px]">
                            <span className="text-[10px] text-[#667781]">{currentTime}</span>
                            <CheckCheck className="w-[14px] h-[14px] text-[#53BDEB]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA Buttons (URL / Phone) — outside bubble */}
                    {ctaButtons.length > 0 && (
                      <div className="mt-[3px] space-y-[1px]">
                        {ctaButtons.map((btn, i) => (
                          <div key={i}
                            className="bg-white rounded-[8px] flex items-center justify-center gap-1.5 py-[7px] shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
                            {btn.type === 'URL' ? (
                              <ExternalLink className="w-3.5 h-3.5 text-[#00A5F4]" />
                            ) : (
                              <Phone className="w-3.5 h-3.5 text-[#00A5F4]" />
                            )}
                            <span className="text-[13px] font-medium text-[#00A5F4]">
                              {btn.text || (btn.type === 'URL' ? t('whatsapp.preview_visit_website') : t('whatsapp.preview_call'))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Reply Buttons — outside bubble, row layout */}
                    {qrButtons.length > 0 && (
                      <div className="mt-[3px] flex flex-wrap gap-[3px]">
                        {qrButtons.map((btn, i) => (
                          <div key={i}
                            className="bg-white rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-3 py-[6px] flex items-center justify-center border border-neutral-100">
                            <span className="text-[12px] font-medium text-[#00A5F4]">
                              {btn.text || t('whatsapp.preview_reply')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-[11px] text-neutral-400 italic">{t('whatsapp.preview_empty')}</p>
                  </div>
                )}
              </div>

              {/* Bottom input bar — modern WhatsApp style */}
              <div className="bg-[#F0F2F5] px-2 py-[6px] flex items-center gap-1.5 shrink-0">
                <div className="flex-1 bg-white rounded-full px-3 py-[6px] flex items-center gap-2 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                  <svg className="w-4 h-4 text-[#8696A0] shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" /></svg>
                  <span className="text-[12px] text-[#8696A0]">{t('whatsapp.preview_message')}</span>
                </div>
                <div className="w-[34px] h-[34px] rounded-full bg-[#00A884] flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
