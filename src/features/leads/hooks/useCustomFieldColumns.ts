/**
 * useCustomFieldColumns Hook
 * Isolated layer for generating custom field table columns
 *
 * Architecture: Clean separation of concerns
 * - Fetches custom field schemas
 * - Generates DataTable column definitions
 * - Handles i18n, loading states, errors
 *
 * Usage:
 * const { columns, isLoading } = useCustomFieldColumns();
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTableCustomFieldSchemas } from './useCustomFieldSchemas';
import { renderCustomFieldValue, getCustomFieldValue, getColumnWidth } from '../utils/customFieldTableRenderer';
import { useDateLocale } from '@/lib/dateConfig';
import type { Lead } from '../types/lead.types';
import type { ColumnDef } from '@/components/ui/DataTable/DataTable';

/**
 * Hook return type
 */
interface UseCustomFieldColumnsReturn {
  /** Generated column definitions for DataTable */
  columns: ColumnDef<Lead>[];

  /** Loading state for schema fetching */
  isLoading: boolean;

  /** Error state for schema fetching */
  error: Error | null;

  /** Number of custom field columns generated */
  count: number;
}

/**
 * Generate custom field table columns from schemas
 *
 * @returns Column definitions, loading state, and metadata
 *
 * @example
 * const { columns, isLoading } = useCustomFieldColumns();
 *
 * // Merge with static columns
 * const allColumns = [...baseColumns, ...columns, ...fixedColumns];
 */
export const useCustomFieldColumns = (): UseCustomFieldColumnsReturn => {
  const { i18n } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();

  // Fetch table-visible custom field schemas
  const {
    data: schemas = [],
    isLoading,
    error,
  } = useTableCustomFieldSchemas();

  // Generate column definitions
  const columns = useMemo<ColumnDef<Lead>[]>(() => {
    if (!schemas || schemas.length === 0) {
      return [];
    }

    return schemas.map((schema) => {
      // Select label based on current locale
      const label = i18n.language === 'ar' ? schema.name_ar : schema.name_en;

      // Get optimal width for field type
      const width = getColumnWidth(schema.field_type);

      return {
        // Prefix with 'custom_' to avoid conflicts with static columns
        key: `custom_${schema.field_key}` as keyof Lead,

        // Translated label
        label,

        // Not sortable initially (can be enabled later with backend support)
        sortable: false,

        // Type-optimized width
        width,
        cellClassName: `w-[${width}]`,

        // Render function
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
  }, [schemas, i18n.language, formatSmartTimestamp]);

  return {
    columns,
    isLoading,
    error: error || null,
    count: columns.length,
  };
};
