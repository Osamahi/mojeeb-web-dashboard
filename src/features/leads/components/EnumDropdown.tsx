/**
 * EnumDropdown
 *
 * Generic schema-driven enum picker for custom_field_schemas of type 'enum'.
 * Modeled on LeadStatusDropdown so the popup styling / RTL / click-outside /
 * stopPropagation behavior stays identical across pickers (status, owner,
 * enum custom fields).
 *
 * Renders the schema's options[] (with `color` + bilingual labels). On the
 * empty state shows "+ Add <field name>" so users discover the affordance.
 */

import { Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { CustomFieldSchema } from '../types/customFieldSchema.types';

interface EnumDropdownProps {
  schema: CustomFieldSchema;
  value: string | null | undefined;
  onChange: (next: string) => void;
  disabled?: boolean;
  /**
   * Bordered trigger style — matches sibling form controls (input height +
   * full width). Default (false) is borderless used inline in table cells.
   */
  bordered?: boolean;
}

export function EnumDropdown({ schema, value, onChange, disabled = false, bordered = false }: EnumDropdownProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith('ar');

  const selected = schema.options?.find((opt) => opt.value === String(value));
  const selectedLabel = selected ? (isAr ? selected.label_ar : selected.label_en) : null;
  const selectedColor = selected?.color ?? '#374151';

  const isEmpty = value === null || value === undefined || value === '';

  const triggerClasses = bordered
    ? 'flex w-full items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
    : 'inline-flex items-center gap-1.5 px-2 py-1 text-[13px] font-medium bg-transparent rounded-md hover:bg-neutral-50 focus:outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={triggerClasses}
            style={{ color: isEmpty ? '#9ca3af' : selectedColor }}
          >
            {isEmpty ? (
              <span className={bordered ? 'flex-1 text-start' : undefined}>
                {t('leads.select_empty')}
              </span>
            ) : (
              <>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedColor }}
                  aria-hidden
                />
                <span className={bordered ? 'flex-1 text-start truncate' : undefined}>
                  {selectedLabel}
                </span>
              </>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[10rem]">
          {schema.options?.map((opt) => {
            const isSelected = opt.value === String(value);
            const label = isAr ? opt.label_ar : opt.label_en;
            return (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => {
                  if (!isSelected) onChange(opt.value);
                }}
                className="gap-2"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: opt.color ?? '#9ca3af' }}
                  aria-hidden
                />
                <span className="flex-1 text-start">{label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
