/**
 * LeadCard Component
 * Mobile-friendly card view for individual lead
 * Clean vertical layout following minimal design system
 */

import { Copy, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { formatPhoneNumber } from '../utils/formatting';
import type { Lead, LeadStatus } from '../types';

interface LeadCardProps {
  lead: Lead;
  onCardClick: (lead: Lead) => void;
  onEditClick: (leadId: string) => void;
  onDeleteClick: (leadId: string) => void;
  onViewConversation: (conversationId: string) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;
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
  isUpdating = false,
}: LeadCardProps) {
  return (
    <div
      className="bg-white border border-neutral-200 rounded-lg p-4 cursor-pointer hover:border-neutral-300 transition-colors"
      onClick={() => onCardClick(lead)}
    >
      {/* Header: Name + Phone + Actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 truncate mb-1">
            {lead.name || 'Add Name'}
          </h3>
          {lead.phone && (
            <div className="flex items-center gap-2">
              <a
                href={`tel:${lead.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                {formatPhoneNumber(lead.phone)}
              </a>
              <button
                onClick={(e) => onCopyPhone(lead.phone!, e)}
                className="p-1.5 hover:bg-neutral-100 rounded transition-all"
                title="Copy phone number"
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
              title="View conversation"
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
            title="Edit lead"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(lead.id);
            }}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Delete lead"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Preview */}
      {lead.summary && (
        <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
          {lead.summary}
        </p>
      )}

      {/* Footer: Status + Date */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-100">
        {/* Status Dropdown */}
        <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
          <select
            value={lead.status}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(lead.id, e.target.value as LeadStatus);
            }}
            disabled={isUpdating}
            className={`px-3 py-1.5 text-sm font-medium bg-transparent rounded-md hover:bg-neutral-50 focus:outline-none transition-colors cursor-pointer appearance-none ${
              lead.status === 'new' ? 'text-[#00D084]' : 'text-neutral-950'
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.25em 1.25em',
              paddingRight: '2.5rem',
            }}
          >
            <option value="new">New</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Created Date */}
        <div className="text-xs text-neutral-500 text-right">
          {(() => {
            try {
              const dateStr = lead.createdAt.toString();
              const date = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`);
              if (isNaN(date.getTime())) return '—';

              return (
                <>
                  <div>{date.toLocaleDateString()}</div>
                  <div>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </>
              );
            } catch {
              return '—';
            }
          })()}
        </div>
      </div>
    </div>
  );
}
