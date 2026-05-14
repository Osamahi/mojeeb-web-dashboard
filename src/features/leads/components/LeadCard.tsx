/**
 * LeadCard Component
 * Mobile-friendly card view for individual lead
 * Clean vertical layout following minimal design system
 */

import { Copy, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPhoneNumber } from '../utils/formatting';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { useDateLocale } from '@/lib/dateConfig';
import { LeadStatusDropdown } from './LeadStatusDropdown';
import { LatestNoteCell } from './LatestNoteCell';
import type { Lead, LeadStatus } from '../types';

interface LeadCardProps {
  lead: Lead;
  onCardClick: (lead: Lead) => void;
  onEditClick: (leadId: string) => void;
  onDeleteClick: (leadId: string) => void;
  onViewConversation: (conversationId: string) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;
  onAddNoteClick: (leadId: string, name: string, agentId: string) => void;
  isUpdating?: boolean;
}

export function LeadCard({
  lead,
  onCardClick,
  onEditClick,
  onDeleteClick,
  onViewConversation,
  onStatusChange,
  onCopyPhone,
  onAddNoteClick,
  isUpdating = false,
}: LeadCardProps) {
  const { t } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();

  return (
    <div
      className="bg-white border border-neutral-200 rounded-lg p-4 cursor-pointer hover:border-neutral-300 transition-colors"
      onClick={() => onCardClick(lead)}
    >
      {/* Header: Name + Phone + Actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 truncate mb-1">
            {lead.name || t('lead_card.add_name')}
          </h3>
          {lead.phone && (
            <div className="flex items-center gap-2">
              <a
                href={`tel:${lead.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <PhoneNumber value={lead.phone} />
              </a>
              <button
                onClick={(e) => onCopyPhone(lead.phone!, e)}
                className="p-1.5 hover:bg-neutral-100 rounded transition-all"
                title={t('lead_card.copy_phone')}
              >
                <Copy className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.conversationId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewConversation(lead.conversationId!);
              }}
              className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={t('lead_card.view_conversation')}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(lead.id);
            }}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={t('lead_card.edit_lead')}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(lead.id);
            }}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={t('lead_card.delete_lead')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Preview */}
      {lead.summary && (
        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
          {lead.summary}
        </p>
      )}

      {/* Latest Note */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="py-3 border-t border-neutral-100"
      >
        <LatestNoteCell lead={lead} onAddNoteClick={onAddNoteClick} />
      </div>

      {/* Footer: Date + Status */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-100">
        {/* Created Date */}
        <div className="text-xs text-neutral-500">
          {(() => {
            try {
              return formatSmartTimestamp(lead.createdAt);
            } catch {
              return '—';
            }
          })()}
        </div>

        {/* Status Dropdown */}
        <LeadStatusDropdown
          status={lead.status}
          onChange={(next) => onStatusChange(lead.id, next)}
          disabled={isUpdating}
          className="flex-shrink-0"
        />
      </div>
    </div>
  );
}
