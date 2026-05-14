/**
 * useLeadTableColumns
 *
 * Builds TanStack `ColumnDef<Lead>` array for the Clients table. Composes:
 *   - System columns (name / phone / summary / status / notes / created_at)
 *     using the specialized renderers in `systemFieldRenderers`
 *   - Custom columns from the agent's schema, using the generic
 *     `renderCustomFieldValue`
 *   - An actions column (View conversation / Edit / Delete)
 *
 * Replaces the older `useSystemFieldColumns` + `useCustomFieldColumns` pair
 * that targeted the hand-rolled `DataTable`. This hook returns the modern
 * `ColumnDef` shape consumed by `DataTableV2`.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useTableCustomFieldSchemas } from './useCustomFieldSchemas';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useDateLocale } from '@/lib/dateConfig';
import {
  getSystemFieldRenderer,
  getSystemFieldColumnWidth,
  isSystemFieldSortable,
  type SystemFieldRenderContext,
} from '../utils/systemFieldRenderers';
import {
  renderCustomFieldValue,
  getCustomFieldValue,
  getColumnWidth,
} from '../utils/customFieldTableRenderer';
import type { Lead } from '../types/lead.types';

export interface UseLeadTableColumnsOptions {
  ctx: SystemFieldRenderContext;
  onViewConversation: (conversationId: string) => void;
  onEditClick: (leadId: string) => void;
  onDeleteClick: (leadId: string) => void;
}

export interface UseLeadTableColumnsResult {
  columns: ColumnDef<Lead, any>[];
  /** Column IDs grouped by pinning side — pass to `DataTableV2.initialColumnPinning`. */
  pinning: { left: string[]; right: string[] };
  isLoading: boolean;
}

/** Parses a "240px" / "auto" / "" width to a TanStack `size` number. */
function parseWidth(width: string | undefined): number | undefined {
  if (!width) return undefined;
  const px = parseInt(width, 10);
  return Number.isFinite(px) ? px : undefined;
}

export function useLeadTableColumns({
  ctx,
  onViewConversation,
  onEditClick,
  onDeleteClick,
}: UseLeadTableColumnsOptions): UseLeadTableColumnsResult {
  const { t, i18n } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();
  const { data: allSchemas = [], isLoading } = useTableCustomFieldSchemas();
  const isMobile = useIsMobile();

  const columns = useMemo<ColumnDef<Lead, any>[]>(() => {
    // Stable system-column id: `column.id` defaults to `accessorKey`, which we
    // don't want — we want our schema `field_key`. So we set `id` explicitly.

    // 1) System fields (specialized renderers + sortable per field)
    const systemSchemas = allSchemas
      .filter((s) => s.is_system && s.show_in_table)
      .sort((a, b) => a.display_order - b.display_order);

    const systemCols: ColumnDef<Lead, any>[] = systemSchemas
      .map<ColumnDef<Lead, any> | null>((schema) => {
        const renderer = getSystemFieldRenderer(schema.field_key, ctx, schema);
        // Some system fields are rendered inside another (phone lives in name).
        if (!renderer && schema.field_key === 'phone') return null;

        const label = i18n.language.startsWith('ar') ? schema.name_ar : schema.name_en;
        const widthPx = parseWidth(getSystemFieldColumnWidth(schema.field_key));

        return {
          id: schema.field_key,
          accessorKey: schema.field_key as keyof Lead as string,
          header: label,
          enableSorting: isSystemFieldSortable(schema.field_key),
          enableHiding: schema.field_key !== 'name', // name is the identity column
          size: widthPx,
          meta: { label },
          cell: ({ row }) => (renderer ? renderer(undefined, row.original) : null),
        };
      })
      .filter((c): c is ColumnDef<Lead, any> => c !== null);

    // 2) Custom (non-system) fields — generic renderer
    const customSchemas = allSchemas
      .filter((s) => !s.is_system)
      .sort((a, b) => a.display_order - b.display_order);

    const customCols: ColumnDef<Lead, any>[] = customSchemas.map((schema) => {
      const label = i18n.language.startsWith('ar') ? schema.name_ar : schema.name_en;
      const widthPx = parseWidth(getColumnWidth(schema.field_type));

      return {
        id: `custom_${schema.field_key}`,
        header: label,
        enableSorting: false,
        enableHiding: true,
        size: widthPx,
        meta: { label },
        cell: ({ row }) =>
          renderCustomFieldValue({
            value: getCustomFieldValue(row.original, schema.field_key),
            schema,
            formatSmartTimestamp,
            locale: i18n.language,
          }),
      };
    });

    // 3) Actions column — pinned right, never hideable
    const actionsCol: ColumnDef<Lead, any> = {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      // No explicit size: column sizes to its content (three icons on desktop,
      // one three-dot button on mobile via Tailwind responsive classes).
      meta: {
        label: t('data_table.actions'),
        cellClassName: 'text-end whitespace-nowrap',
      },
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-end"
          >
            {/* Desktop: three inline icons (md and up) */}
            <div className="hidden md:flex items-center gap-1">
              {lead.conversationId ? (
                <button
                  onClick={() => onViewConversation(lead.conversationId!)}
                  className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
                  title={t('leads.view_conversation_title')}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-8 h-8" />
              )}
              <button
                onClick={() => onEditClick(lead.id)}
                className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
                title={t('leads.edit_lead_title')}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteClick(lead.id)}
                className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
                title={t('leads.delete_lead_title')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile: collapse to three-dot menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
                    title={t('leads.more')}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {lead.conversationId && (
                    <DropdownMenuItem
                      onClick={() => onViewConversation(lead.conversationId!)}
                    >
                      <MessageSquare className="w-4 h-4 ltr:mr-2 rtl:ml-2 text-neutral-500" />
                      <span>{t('leads.conversation_menu_item')}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onEditClick(lead.id)}>
                    <Pencil className="w-4 h-4 ltr:mr-2 rtl:ml-2 text-neutral-500" />
                    <span>{t('leads.edit_lead_title')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteClick(lead.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                    <span>{t('leads.delete_lead_title')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      },
    };

    // Merge by display_order across system+custom, then append actions.
    const ordered = [...systemCols, ...customCols].sort((a, b) => {
      // Stable ordering by display_order from the schemas. The original
      // schemas array drives this; system/custom split is just for shape.
      const aSchema = allSchemas.find(
        (s) => (s.is_system ? s.field_key : `custom_${s.field_key}`) === a.id,
      );
      const bSchema = allSchemas.find(
        (s) => (s.is_system ? s.field_key : `custom_${s.field_key}`) === b.id,
      );
      return (aSchema?.display_order ?? 0) - (bSchema?.display_order ?? 0);
    });

    return [...ordered, actionsCol];
  }, [
    allSchemas,
    ctx,
    i18n.language,
    t,
    formatSmartTimestamp,
    onViewConversation,
    onEditClick,
    onDeleteClick,
  ]);

  return {
    columns,
    // Pin name left on desktop (row identity), actions stay pinned right
    // everywhere. On mobile (<768px) we leave name unpinned so it scrolls
    // with the rest — pinning it would eat too much of the narrow viewport.
    pinning: isMobile
      ? { left: [], right: ['actions'] }
      : { left: ['name'], right: ['actions'] },
    isLoading,
  };
}
