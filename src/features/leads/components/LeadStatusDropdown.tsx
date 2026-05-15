/**
 * LeadStatusDropdown
 *
 * The single source of truth for the lead-status picker UX, used everywhere
 * a user can change a lead's status:
 *   - Leads-page table column (systemFieldRenderers)
 *   - Leads-page filter toolbar (LeadsFiltersToolbar — with allowAll/bordered)
 *   - Lead detail drawer (LeadInlineDetails)
 *
 * Built on the app's `DropdownMenu` primitive (same one as the conversation
 * three-dot menu) so the popup styling, animation, click-outside, z-index,
 * and keyboard behavior stay consistent app-wide — no browser-native
 * `<select>` popup, which looks foreign next to the rest of the design.
 *
 * The trigger is borderless with the current status color applied to the
 * label text and a chevron-down. Each menu item gets a small color dot
 * (matching LeadStatusBadge) and the active row shows a check icon.
 *
 * `stopPropagation` is baked in so the picker can sit inside a row that
 * already has its own click handler (e.g. a table row that opens a drawer).
 */

import { Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useLeadStatusSchema } from '../hooks/useLeadStatusSchema';
import type { LeadStatus } from '../types';

interface LeadStatusDropdownProps {
  /** Current status. Pass 'all' (when allowAll is true) to mean "no filter". */
  status: string;
  onChange: (next: LeadStatus | 'all') => void;
  disabled?: boolean;
  className?: string;
  /**
   * When true, prepends an "All statuses" entry. Used by the filter toolbar
   * (where 'all' = unfiltered). Defaults to false so per-lead pickers can't
   * accidentally set a lead's status to 'all'.
   */
  allowAll?: boolean;
  /**
   * Bordered trigger style — matches sibling filter controls
   * (date popover button etc.) on the Leads page filter strip. The default
   * (false) is a borderless trigger used inline in lead rows / cells.
   */
  bordered?: boolean;
}

export function LeadStatusDropdown({
  status,
  onChange,
  disabled = false,
  className,
  allowAll = false,
  bordered = false,
}: LeadStatusDropdownProps) {
  const { t } = useTranslation();
  const { statusOptions, getStatusLabel, getStatusColor } = useLeadStatusSchema();

  const isAll = status === 'all';
  const triggerLabel = isAll ? t('common.status_all') : getStatusLabel(status);
  // Neutral color when "all" is selected — no status color is meaningful.
  const triggerColor = isAll ? '#374151' : getStatusColor(status);

  // `bordered` is the form-style variant (matches input height + width).
  // Inline/cell variant stays content-sized so it sits naturally next to text.
  const triggerClasses = bordered
    ? 'flex w-full items-center justify-between gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
    : 'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-transparent rounded-md hover:bg-neutral-50 focus:outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    // Wrap in a div that stops row-click bubbling so this can drop into a
    // clickable parent (e.g. a table row) without the row reacting too.
    <div onClick={(e) => e.stopPropagation()} className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={triggerClasses}
            style={{ color: triggerColor }}
          >
            {triggerLabel}
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[10rem]">
          {allowAll && (
            <DropdownMenuItem
              onClick={() => {
                if (!isAll) onChange('all');
              }}
              className="gap-2"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 bg-neutral-300"
                aria-hidden
              />
              <span className="flex-1 text-start">{t('common.status_all')}</span>
              {isAll && (
                <Check className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0" />
              )}
            </DropdownMenuItem>
          )}
          {statusOptions.map((opt) => {
            const isSelected = opt.value === status;
            return (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => {
                  if (!isSelected) onChange(opt.value as LeadStatus);
                }}
                className="gap-2"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getStatusColor(opt.value) }}
                  aria-hidden
                />
                <span className="flex-1 text-start">{getStatusLabel(opt.value)}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
