/**
 * ColumnChooser
 *
 * Popover that lists every column in the table and lets the user toggle
 * visibility. Notion / Airtable / Linear all ship this as the answer to
 * "unlimited columns" — instead of forcing the user to horizontally scroll
 * past 30 fields, they pick what's visible per view.
 *
 * The popover renders as a `DropdownMenu` so the dismissal / z-index /
 * keyboard behavior stays consistent with every other menu in the app.
 *
 * Visibility state is owned by the parent `DataTableV2` (sourced from
 * TanStack Table's `columnVisibility` state). This component is purely a
 * controlled view — persistence happens upstream.
 */

import { Check, Columns3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';

export interface ColumnChooserItem {
  /** Unique column id (matches TanStack `column.id`). */
  id: string;
  /** Localized display label. */
  label: string;
  /** Current visibility. */
  visible: boolean;
  /**
   * Columns marked `pinned` cannot be hidden by the user — typically the
   * identity column (name) and the actions column. Renders as a disabled
   * row with a hint that it's required.
   */
  pinned?: boolean;
}

interface ColumnChooserProps {
  items: ColumnChooserItem[];
  onToggle: (id: string, next: boolean) => void;
  /** Optional callback for a "Reset" link at the bottom of the popover. */
  onReset?: () => void;
}

export function ColumnChooser({ items, onToggle, onReset }: ColumnChooserProps) {
  const { t } = useTranslation();
  const visibleCount = items.filter((i) => i.visible).length;
  const totalCount = items.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
          title={t('data_table.columns')}
        >
          <Columns3 className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t('data_table.columns')}
            <span className="ms-1 text-gray-400">
              {visibleCount}/{totalCount}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-[60vh] overflow-y-auto p-0">
        <div className="px-3 py-2 border-b border-neutral-100 text-xs font-medium text-neutral-500 uppercase tracking-wider sticky top-0 bg-white">
          {t('data_table.toggle_columns')}
        </div>
        <div className="py-1">
          {items.map((item) => {
            const disabled = item.pinned === true;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={item.visible}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) onToggle(item.id, !item.visible);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm text-start',
                  disabled
                    ? 'text-neutral-400 cursor-not-allowed'
                    : 'text-neutral-700 hover:bg-neutral-50 cursor-pointer',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-4 w-4 items-center justify-center rounded border flex-shrink-0',
                    item.visible
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : 'bg-white border-neutral-300',
                  )}
                  aria-hidden
                >
                  {item.visible && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {disabled && (
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    {t('data_table.required')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {onReset && (
          <div className="border-t border-neutral-100 px-3 py-2 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              {t('data_table.reset_columns')}
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
