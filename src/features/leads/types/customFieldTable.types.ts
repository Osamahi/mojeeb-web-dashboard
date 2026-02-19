/**
 * Custom Field Table Integration Types
 * Isolated type definitions for custom field table rendering
 */

import type { Lead } from './lead.types';
import type { CustomFieldSchema } from './customFieldSchema.types';

/**
 * Custom field column definition for DataTable
 */
export interface CustomFieldColumnDef {
  key: string;
  label: string;
  sortable: boolean;
  width: string;
  cellClassName?: string;
  render: (value: unknown, lead: Lead) => React.ReactNode;
}

/**
 * Configuration for custom field rendering
 */
export interface CustomFieldRenderConfig {
  schema: CustomFieldSchema;
  lead: Lead;
  formatSmartTimestamp: (date: string, options?: { showTimezone?: boolean; useRelative?: boolean }) => string;
  locale: string;
}

/**
 * Custom field value with metadata
 */
export interface CustomFieldValue {
  raw: unknown;
  formatted: React.ReactNode;
  isEmpty: boolean;
}
