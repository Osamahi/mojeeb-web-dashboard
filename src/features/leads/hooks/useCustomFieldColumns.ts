/**
 * useCustomFieldColumns Hook
 * Generates DataTable column definitions from custom field schemas
 *
 * Architecture: Clean separation of concerns
 * - useCustomFieldColumns: non-system custom field columns (generic renderers)
 * - useSystemFieldColumns: system field columns (specialized renderers)
 * - Both driven by custom_field_schemas table (unified source of truth)
 *
 * Usage:
 * const { columns: customCols } = useCustomFieldColumns();
 * const { systemColumns } = useSystemFieldColumns(ctx);
 * allColumns = [...systemColumns, ...customCols, actionsColumn];
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTableCustomFieldSchemas } from './useCustomFieldSchemas';
import { renderCustomFieldValue, getCustomFieldValue, getColumnWidth } from '../utils/customFieldTableRenderer';
import {
  getSystemFieldRenderer,
  getSystemFieldColumnWidth,
  isSystemFieldSortable,
  type SystemFieldRenderContext,
} from '../utils/systemFieldRenderers';
import { useDateLocale } from '@/lib/dateConfig';
import type { Lead } from '../types/lead.types';
import type { ColumnDef } from '@/components/ui/DataTable/DataTable';

// ============================================================
// Non-system custom field columns (generic renderers)
// ============================================================

interface UseCustomFieldColumnsReturn {
  /** Generated column definitions for non-system custom fields */
  columns: ColumnDef<Lead>[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Number of custom field columns */
  count: number;
}

/**
 * Generate non-system custom field table columns from schemas
 */
export const useCustomFieldColumns = (): UseCustomFieldColumnsReturn => {
  const { i18n } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();

  const {
    data: allSchemas = [],
    isLoading,
    error,
  } = useTableCustomFieldSchemas();

  // Filter out system fields — only custom fields here
  const customSchemas = useMemo(
    () => allSchemas.filter((s) => !s.is_system),
    [allSchemas],
  );

  const columns = useMemo<ColumnDef<Lead>[]>(() => {
    if (!customSchemas || customSchemas.length === 0) {
      return [];
    }

    return customSchemas.map((schema) => {
      const label = i18n.language.startsWith('ar') ? schema.name_ar : schema.name_en;
      const width = getColumnWidth(schema.field_type);

      return {
        key: `custom_${schema.field_key}` as keyof Lead,
        label,
        sortable: false,
        width,
        cellClassName: `w-[${width}]`,
        render: (_: unknown, lead: Lead) => {
          const value = getCustomFieldValue(lead, schema.field_key);
          return renderCustomFieldValue({
            value,
            schema,
            formatSmartTimestamp,
            locale: i18n.language,
          });
        },
      };
    });
  }, [customSchemas, i18n.language, formatSmartTimestamp]);

  return {
    columns,
    isLoading,
    error: error || null,
    count: columns.length,
  };
};

// ============================================================
// System field columns (specialized renderers)
// ============================================================

interface UseSystemFieldColumnsReturn {
  /** Generated column definitions for system fields */
  systemColumns: ColumnDef<Lead>[];
  /** Whether this agent has system field schemas */
  hasSystemFields: boolean;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Generate system field table columns from schemas
 * System fields use specialized renderers (inline edit, status dropdown, etc.)
 *
 * @param ctx - Render context containing callbacks and state for interactive cells
 */
export const useSystemFieldColumns = (
  ctx: SystemFieldRenderContext,
): UseSystemFieldColumnsReturn => {
  const { i18n } = useTranslation();

  const {
    data: allSchemas = [],
    isLoading,
  } = useTableCustomFieldSchemas();

  // Filter to system fields only, sorted by display_order
  const systemSchemas = useMemo(
    () => allSchemas
      .filter((s) => s.is_system && s.show_in_table)
      .sort((a, b) => a.display_order - b.display_order),
    [allSchemas],
  );

  const hasSystemFields = systemSchemas.length > 0;

  const systemColumns = useMemo<ColumnDef<Lead>[]>(() => {
    if (!hasSystemFields) return [];

    return systemSchemas
      .map((schema) => {
        const label = i18n.language.startsWith('ar') ? schema.name_ar : schema.name_en;
        const renderer = getSystemFieldRenderer(schema.field_key, ctx, schema);

        // Skip fields without a specialized renderer (e.g. phone is rendered inside name)
        if (!renderer && schema.field_key === 'phone') return null;

        const width = getSystemFieldColumnWidth(schema.field_key);

        return {
          key: schema.field_key as keyof Lead,
          label,
          sortable: isSystemFieldSortable(schema.field_key),
          width,
          cellClassName: schema.field_key === 'summary' ? `w-[${width}]` : `w-[${width}]`,
          render: renderer
            ? (_: unknown, lead: Lead) => renderer(undefined, lead)
            : undefined,
        };
      })
      .filter(Boolean) as ColumnDef<Lead>[];
  }, [systemSchemas, i18n.language, ctx, hasSystemFields]);

  return {
    systemColumns,
    hasSystemFields,
    isLoading,
  };
};
