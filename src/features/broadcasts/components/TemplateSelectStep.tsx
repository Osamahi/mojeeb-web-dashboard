import { useState, useMemo, useRef, useEffect } from 'react';
import { Loader2, Search, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWhatsAppTemplates } from '@/features/whatsapp/hooks/useWhatsAppTemplates';
import { useConnections } from '@/features/connections/hooks/useConnections';
import { PlatformIcon } from '@/features/connections/components/PlatformIcon';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import type { MessageTemplate } from '@/features/whatsapp/types/whatsapp.types';

interface TemplateSelectStepProps {
  connectionId: string;
  onConnectionChange: (id: string) => void;
  selectedTemplate: MessageTemplate | null;
  onTemplateSelect: (template: MessageTemplate) => void;
  paramValues: Record<string, string>;
  onParamChange: (key: string, value: string) => void;
}

export function TemplateSelectStep({
  connectionId,
  onConnectionChange,
  selectedTemplate,
  onTemplateSelect,
  paramValues,
  onParamChange,
}: TemplateSelectStepProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: allConnections = [], isLoading: connectionsLoading } = useConnections();
  const connections = useMemo(
    () => allConnections.filter((c) => c.platform === 'whatsapp' && c.isActive),
    [allConnections]
  );

  const selectedConnection = useMemo(
    () => connections.find((c) => c.id === connectionId),
    [connections, connectionId]
  );

  const { data: templates = [], isLoading: templatesLoading } = useWhatsAppTemplates(connectionId || undefined);

  const approvedTemplates = useMemo(
    () => templates.filter((t) => t.status === 'APPROVED'),
    [templates]
  );

  const filteredTemplates = useMemo(
    () => search
      ? approvedTemplates.filter((t) =>
          t.name.toLowerCase().includes(search.toLowerCase())
        )
      : approvedTemplates,
    [approvedTemplates, search]
  );

  const placeholders = useMemo(() => {
    if (!selectedTemplate) return [];
    const bodyComponent = selectedTemplate.components?.find((c) => c.type === 'BODY');
    if (!bodyComponent?.text) return [];
    const matches = bodyComponent.text.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.map((m) => m.replace(/[{}]/g, '')) : [];
  }, [selectedTemplate]);

  const previewText = useMemo(() => {
    if (!selectedTemplate) return '';
    const bodyComponent = selectedTemplate.components?.find((c) => c.type === 'BODY');
    if (!bodyComponent?.text) return '';
    let text = bodyComponent.text;
    Object.entries(paramValues).forEach(([key, value]) => {
      text = text.replace(`{{${key}}}`, value || `{{${key}}}`);
    });
    return text;
  }, [selectedTemplate, paramValues]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function getVerifiedName(conn: typeof connections[0]) {
    const meta = conn.platformMetadata as Record<string, unknown> | null;
    return (meta?.verified_name as string) || conn.platformAccountName || '';
  }

  function getDisplayPhone(conn: typeof connections[0]) {
    const meta = conn.platformMetadata as Record<string, unknown> | null;
    return (meta?.display_phone_number as string) || conn.platformAccountHandle || conn.platformAccountId || '';
  }

  return (
    <div className="space-y-4">
      {/* Connection Selector — custom dropdown matching WhatsApp Management */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">{t('broadcasts.template_connection')}</label>
        {connectionsLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        ) : connections.length === 0 ? (
          <p className="text-sm text-neutral-400">{t('broadcasts.template_no_approved')}</p>
        ) : (
          <div ref={dropdownRef} className="relative">
            {/* Trigger */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center gap-3 rounded-lg border bg-white p-2.5 transition-all cursor-pointer hover:shadow-sm ${
                isDropdownOpen ? 'border-green-500 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex-shrink-0 relative">
                <PlatformIcon platform="whatsapp" size="sm" variant="brand" showBackground />
                {selectedConnection?.isActive && (
                  <div className="absolute bottom-0 end-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-start">
                {selectedConnection ? (
                  <>
                    <h3 className="text-sm font-medium text-neutral-900 truncate">
                      {getVerifiedName(selectedConnection)}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <PhoneNumber value={getDisplayPhone(selectedConnection)} className="truncate" />
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-neutral-400">{t('broadcasts.template_select_connection')}</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden">
                {connections.map((conn) => {
                  const isSelected = connectionId === conn.id;
                  return (
                    <button
                      key={conn.id}
                      type="button"
                      onClick={() => {
                        onConnectionChange(conn.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 transition-colors text-start ${
                        isSelected ? 'bg-green-50' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex-shrink-0 relative">
                        <PlatformIcon platform="whatsapp" size="sm" variant="brand" showBackground />
                        <div className="absolute bottom-0 end-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-neutral-900 truncate">
                          {getVerifiedName(conn)}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                          <PhoneNumber value={getDisplayPhone(conn)} className="truncate" />
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {connectionId && (
        <>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('broadcasts.template_label_pick')} {templatesLoading && <Loader2 className="w-3 h-3 inline animate-spin" />}
            </label>
            <div className="relative mb-2">
              <Search className="absolute start-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('broadcasts.template_search')}
                className="w-full ps-9 pe-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 text-sm"
              />
            </div>
            <div className="border border-neutral-200 rounded-lg max-h-48 overflow-y-auto">
              {filteredTemplates.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-neutral-400">
                  {templatesLoading ? t('broadcasts.loading') : t('broadcasts.template_no_approved')}
                </div>
              ) : (
                filteredTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => onTemplateSelect(tmpl)}
                    className={`w-full text-start px-4 py-2 text-sm border-b border-neutral-50 transition-colors ${
                      selectedTemplate?.id === tmpl.id
                        ? 'bg-neutral-100 font-medium'
                        : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="font-medium text-neutral-900">{tmpl.name}</div>
                    <div className="text-xs text-neutral-400 flex gap-2">
                      <span>{tmpl.language}</span>
                      <span>&middot;</span>
                      <span>{tmpl.category}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedTemplate && placeholders.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('broadcasts.template_variables')}</label>
              <div className="space-y-2">
                {placeholders.map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 w-10 shrink-0">{`{{${key}}}`}</span>
                    <input
                      type="text"
                      value={paramValues[key] || ''}
                      onChange={(e) => onParamChange(key, e.target.value)}
                      placeholder={t('broadcasts.template_var_placeholder', { key: `{{${key}}}` })}
                      className="flex-1 px-3 py-1.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTemplate && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('broadcasts.template_preview')}</label>
              <div className="bg-[#e5ddd5] rounded-lg p-4">
                <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                  <p className="text-sm text-neutral-800 whitespace-pre-wrap">{previewText || t('broadcasts.template_no_body')}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
