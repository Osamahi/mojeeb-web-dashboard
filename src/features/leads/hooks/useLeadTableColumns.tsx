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
import {
  getSystemFieldRenderer,
  getSystemFieldColumnWidth,
  isSystemFieldSortable,
  type SystemFieldRenderContext,
} from '../utils/systemFieldRenderers';
import {
  renderCustomFieldCell,
  getColumnWidth,
  type CustomFieldRenderContext,
} from '../utils/customFieldTableRenderer';
import type { Lead } from '../types/lead.types';

export interface UseLeadTableColumnsOptions {
  ctx: SystemFieldRenderContext;
  /** Per-custom-field save + modal handlers. */
  customCtx: CustomFieldRenderContext;
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
  customCtx,
  onViewConversation,
  onEditClick,
  onDeleteClick,
}: UseLeadTableColumnsOptions): UseLeadTableColumnsResult {
  const { t, i18n } = useTranslation();
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
        cell: ({ row }) => renderCustomFieldCell(row.original, schema, customCtx),
      };
    });

    // 3) Actions column — pinned right, never hideable. Kebab-only across
    //    all viewports: saves horizontal space. The dropdown is uncontrolled
    //    (manages its own open/close); clicking the kebab toggles it.
    const actionsCol: ColumnDef<Lead, any> = {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-all"
                  title={t('leads.more')}
                  aria-label={t('leads.more')}
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
        );
      },
    };

    // Merge by display_order across system+custom, then append actions.
    // Build a column-id → display_order map once so the comparator is O(1).
    const orderById = new Map<string, number>();
    for (const s of allSchemas) {
      const id = s.is_system ? s.field_key : `custom_${s.field_key}`;
      orderById.set(id, s.display_order);
    }
    const ordered = [...systemCols, ...customCols].sort(
      (a, b) => (orderById.get(a.id!) ?? 0) - (orderById.get(b.id!) ?? 0),
    );

    return [...ordered, actionsCol];
  }, [
    allSchemas,
    ctx,
    customCtx,
    i18n.language,
    t,
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
