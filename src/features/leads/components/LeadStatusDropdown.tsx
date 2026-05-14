/**
 * LeadStatusDropdown
 *
 * The single source of truth for the lead-status picker UX, used everywhere
 * a user can change a lead's status:
 *   - Leads-page table card (LeadCard)
 *   - Leads-page table column (systemFieldRenderers)
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useLeadStatusSchema } from '../hooks/useLeadStatusSchema';
import type { LeadStatus } from '../types';

interface LeadStatusDropdownProps {
  status: string;
  onChange: (next: LeadStatus) => void;
  disabled?: boolean;
  className?: string;
}

export function LeadStatusDropdown({
  status,
  onChange,
  disabled = false,
  className,
}: LeadStatusDropdownProps) {
  const { statusOptions, getStatusLabel, getStatusColor } = useLeadStatusSchema();

  return (
    // Wrap in a div that stops row-click bubbling so this can drop into a
    // clickable parent (e.g. a table row) without the row reacting too.
    <div onClick={(e) => e.stopPropagation()} className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-transparent rounded-md hover:bg-neutral-50 focus:outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: getStatusColor(status) }}
          >
            {getStatusLabel(status)}
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[10rem]">
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
