/**
 * WhatsApp Management Page
 * Manage WhatsApp Business templates and phone numbers
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, MessageSquare, CheckCircle2, Phone, Send, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { AddTemplateModal } from '../components/AddTemplateModal';
import { TemplateDetailsModal } from '../components/TemplateDetailsModal';
import { SendTemplateModal } from '../components/SendTemplateModal';
import { useWhatsAppTemplates } from '../hooks/useWhatsAppTemplates';
import { useConnections } from '@/features/connections/hooks/useConnections';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { MessageTemplate } from '../types/whatsapp.types';
import type { PlatformConnection } from '@/features/connections/types';

export default function WhatsAppManagementPage() {
  const { t } = useTranslation();
  const { agentId } = useAgentContext();
  useDocumentTitle('WhatsApp Management');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<PlatformConnection | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [sendTemplate, setSendTemplate] = useState<MessageTemplate | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset state when agent changes globally
  // useConnections() auto-refetches via queryKey reactivity,
  // but local state needs manual reset so auto-select picks the new agent's connections
  useEffect(() => {
    setSelectedPhoneNumber(null);
    setSelectedTemplate(null);
    setIsDetailsModalOpen(false);
    setSendTemplate(null);
    setIsSendModalOpen(false);
    setIsDropdownOpen(false);
  }, [agentId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get all WhatsApp connections
  const { data: connections, isLoading: connectionsLoading } = useConnections();

  const whatsappConnections = useMemo(() => {
    return connections?.filter(conn => conn.platform === 'whatsapp') || [];
  }, [connections]);

  // Get templates for selected phone number
  // SECURITY: Access token retrieved from backend using connectionId
  const connectionId = selectedPhoneNumber?.id;

  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError
  } = useWhatsAppTemplates(connectionId);

  if (templatesError && import.meta.env.DEV) {
    console.error('[WhatsApp Management] Templates error:', templatesError);
  }

  // Auto-select first WhatsApp connection if available
  if (whatsappConnections.length > 0 && !selectedPhoneNumber) {
    setSelectedPhoneNumber(whatsappConnections[0]);
  }

  // Show loading state
  if (connectionsLoading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <MessageSquare className="w-8 h-8 text-neutral-400 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-neutral-500">{t('whatsapp.loading')}</p>
        </div>
      </div>
    );
  }

  // Show empty state if no WhatsApp connections
  if (whatsappConnections.length === 0) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <BaseHeader
          title={t('whatsapp.title')}
          subtitle={t('whatsapp.subtitle')}
        />
        <EmptyState
          icon={<MessageSquare className="w-12 h-12 text-neutral-400" />}
          title={t('whatsapp.no_connections_title')}
          description={t('whatsapp.no_connections_description')}
          action={
            <Button asChild>
              <Link to="/connections">{t('whatsapp.go_to_connections')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <BaseHeader
        title={t('whatsapp.title')}
        subtitle={t('whatsapp.subtitle')}
        primaryAction={{
          label: t('whatsapp.add_template'),
          icon: Plus,
          onClick: () => setIsAddModalOpen(true),
        }}
      />

      {/* Content */}
      <div className="space-y-6">
        {/* Phone Number Selector */}
        <div className="space-y-3">
          {whatsappConnections.length === 1 ? (
            // Single connection: show as a card
            (() => {
              const connection = whatsappConnections[0];
              const verifiedName = (connection.platformMetadata as any)?.verified_name ||
                connection.platformAccountName ||
                t('whatsapp.verified_name');
              const displayPhone = (connection.platformMetadata as any)?.display_phone_number ||
                connection.platformAccountHandle ||
                connection.platformAccountId;

              return (
                <div className="flex items-center gap-3 rounded-lg border border-green-500 bg-white p-3 shadow-sm">
                  <div className="flex-shrink-0 relative">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    {connection.isActive && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 truncate">
                      {verifiedName}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <span className="whitespace-nowrap">WhatsApp</span>
                      <span>·</span>
                      <PhoneNumber value={displayPhone} className="truncate" />
                      {connection.isActive && (
                        <>
                          <span>·</span>
                          <span className="whitespace-nowrap text-green-600 font-medium">{t('whatsapp.connected')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                </div>
              );
            })()
          ) : (
            // Multiple connections: custom dropdown
            <div ref={dropdownRef} className="relative">
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center gap-3 rounded-lg border bg-white p-3 transition-all cursor-pointer hover:shadow-sm ${
                  isDropdownOpen ? 'border-green-500 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex-shrink-0 relative">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  {selectedPhoneNumber?.isActive && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-sm font-semibold text-neutral-900 truncate">
                    {(selectedPhoneNumber?.platformMetadata as any)?.verified_name ||
                      selectedPhoneNumber?.platformAccountName ||
                      t('whatsapp.verified_name')}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <span className="whitespace-nowrap">WhatsApp</span>
                    <span>·</span>
                    <PhoneNumber
                      value={
                        (selectedPhoneNumber?.platformMetadata as any)?.display_phone_number ||
                        selectedPhoneNumber?.platformAccountHandle ||
                        selectedPhoneNumber?.platformAccountId || ''
                      }
                      className="truncate"
                    />
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden">
                  {whatsappConnections.map((connection) => {
                    const isSelected = selectedPhoneNumber?.id === connection.id;
                    const verifiedName = (connection.platformMetadata as any)?.verified_name ||
                      connection.platformAccountName ||
                      t('whatsapp.verified_name');
                    const displayPhone = (connection.platformMetadata as any)?.display_phone_number ||
                      connection.platformAccountHandle ||
                      connection.platformAccountId;

                    return (
                      <button
                        key={connection.id}
                        type="button"
                        onClick={() => {
                          setSelectedPhoneNumber(connection);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3 transition-colors text-left ${
                          isSelected
                            ? 'bg-green-50'
                            : 'hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex-shrink-0 relative">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-green-600" />
                          </div>
                          {connection.isActive && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-neutral-900 truncate">
                            {verifiedName}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                            <PhoneNumber value={displayPhone} className="truncate" />
                            {connection.isActive && (
                              <>
                                <span>·</span>
                                <span className="text-green-600 font-medium">{t('whatsapp.connected')}</span>
                              </>
                            )}
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

        {/* Templates List */}
        {selectedPhoneNumber && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                {t('whatsapp.message_templates')}
              </h2>
              <Badge variant="default">
                {t('whatsapp.templates_count', { count: templates?.length || 0 })}
              </Badge>
            </div>

            {templatesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-neutral-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="space-y-3">
                {templates.map((template) => {
                  // Determine status color
                  const statusColor =
                    template.status === 'APPROVED' ? 'text-green-600' :
                    template.status === 'PENDING' ? 'text-orange-500' :
                    template.status === 'REJECTED' ? 'text-red-600' :
                    'text-neutral-500';

                  return (
                    <div
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsDetailsModalOpen(true);
                      }}
                      className="flex items-center gap-2.5 sm:gap-3 rounded-lg border border-neutral-200 bg-white p-2.5 sm:p-3 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer"
                    >
                      {/* Template Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-neutral-900 truncate">
                          {template.name}
                        </h3>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-neutral-500 flex-wrap">
                          <span className="whitespace-nowrap">{template.category}</span>
                          <span>•</span>
                          <span className="whitespace-nowrap">{template.language}</span>
                          <span>•</span>
                          <span className={`whitespace-nowrap font-medium ${statusColor}`}>
                            {template.status}
                          </span>
                        </div>
                      </div>

                      {/* Send Button (only for APPROVED templates) */}
                      {template.status === 'APPROVED' && (
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSendTemplate(template);
                              setIsSendModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            {t('whatsapp.send')}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<MessageSquare className="w-12 h-12 text-neutral-400" />}
                title={t('whatsapp.no_templates_title')}
                description={t('whatsapp.no_templates_description')}
                action={
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('whatsapp.add_template')}
                  </Button>
                }
              />
            )}
          </div>
        )}
      </div>

      {/* Add Template Modal */}
      {selectedPhoneNumber && (
        <AddTemplateModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          connectionId={selectedPhoneNumber.id}
        />
      )}

      {/* Template Details Modal */}
      <TemplateDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />

      {/* Send Template Modal */}
      {sendTemplate && selectedPhoneNumber && (
        <SendTemplateModal
          isOpen={isSendModalOpen}
          onClose={() => {
            setIsSendModalOpen(false);
            setSendTemplate(null);
          }}
          template={sendTemplate}
          connectionId={selectedPhoneNumber.id}
        />
      )}
    </div>
  );
}
