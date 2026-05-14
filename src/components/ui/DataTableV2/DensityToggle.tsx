/**
 * DensityToggle
 *
 * Three-preset row-density selector — Compact / Regular / Relaxed. Industry
 * standard pattern (Stripe defaults to Regular, Linear defaults to Compact).
 * Renders as a `DropdownMenu` so it composes with the rest of the toolbar
 * controls.
 *
 * Densities map to row paddings inside `DataTableV2`. The actual px heights
 * resolve via Tailwind classes at the consuming end, not here — this
 * component just owns the enum + UI.
 */

import { useTranslation } from 'react-i18next';
import { Rows3, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export type TableDensity = 'compact' | 'regular' | 'relaxed';

interface DensityToggleProps {
  value: TableDensity;
  onChange: (next: TableDensity) => void;
}

export function DensityToggle({ value, onChange }: DensityToggleProps) {
  const { t } = useTranslation();

  const options: Array<{ key: TableDensity; label: string }> = [
    { key: 'compact', label: t('data_table.density_compact') },
    { key: 'regular', label: t('data_table.density_regular') },
    { key: 'relaxed', label: t('data_table.density_relaxed') },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
          title={t('data_table.density')}
        >
          <Rows3 className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {options.map((opt) => {
          const selected = opt.key === value;
          return (
            <DropdownMenuItem
              key={opt.key}
              onClick={() => {
                if (!selected) onChange(opt.key);
              }}
              className={cn('gap-2', selected && 'font-medium')}
            >
              <Check
                className={cn(
                  'h-3.5 w-3.5 flex-shrink-0',
                  selected ? 'text-neutral-900' : 'text-transparent',
                )}
              />
              <span className="flex-1 text-start">{opt.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Row padding class for each density preset. Applied to the `<td>` and `<th>`
 * elements inside DataTableV2 to drive the height. The widths are vertical
 * (`py-*`); horizontal padding stays constant for column-edge alignment.
 */
export const DENSITY_CELL_PADDING_CLASS: Record<TableDensity, string> = {
  compact: 'px-3 py-2',
  regular: 'px-3 py-3',
  relaxed: 'px-4 py-4',
};
