/**
 * Custom Field Table Renderer
 * Pure utility functions for rendering custom field values in table cells
 *
 * Architecture: Isolated, reusable, stateless rendering logic
 * Dependencies: Zero React hooks - only pure functions
 */

import type { ReactNode } from 'react';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import type { CustomFieldSchema, FieldType } from '../types/customFieldSchema.types';
import type { Lead } from '../types/lead.types';

/**
 * Configuration for rendering a custom field value
 */
interface RenderConfig {
  value: unknown;
  schema: CustomFieldSchema;
  formatSmartTimestamp: (date: string, options?: { showTimezone?: boolean; useRelative?: boolean }) => string;
  locale: string;
}

/**
 * Empty value placeholder
 */
const EmptyPlaceholder = (): ReactNode => (
  <span className="text-neutral-400 text-sm">—</span>
);

/**
 * Check if value is empty
 */
const isEmpty = (value: unknown): boolean => {
  return value === null || value === undefined || value === '';
};

/**
 * Render string field type
 */
const renderString = (value: unknown): ReactNode => {
  return <span className="text-sm text-neutral-900">{String(value)}</span>;
};

/**
 * Render text field type (with truncation)
 */
const renderText = (value: unknown): ReactNode => {
  const textValue = String(value);
  const maxLength = 100;
  const isTruncated = textValue.length > maxLength;

  return (
    <span
      className="text-sm text-neutral-700 line-clamp-2"
      title={isTruncated ? textValue : undefined}
    >
      {isTruncated ? `${textValue.substring(0, maxLength)}...` : textValue}
    </span>
  );
};

/**
 * Render number field type
 */
const renderNumber = (value: unknown): ReactNode => {
  return <span className="text-sm text-neutral-900">{String(value)}</span>;
};

/**
 * Render currency field type with locale formatting
 */
const renderCurrency = (value: unknown): ReactNode => {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));

  if (isNaN(numValue)) {
    return <span className="text-sm text-neutral-900">{String(value)}</span>;
  }

  return (
    <span className="text-sm text-neutral-900 font-medium">
      {numValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
};

/**
 * Render email field type (clickable mailto link)
 */
const renderEmail = (value: unknown): ReactNode => {
  return (
    <a
      href={`mailto:${value}`}
      onClick={(e) => e.stopPropagation()}
      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
    >
      {String(value)}
    </a>
  );
};

/**
 * Render phone field type (clickable tel link with PhoneNumber component)
 */
const renderPhone = (value: unknown): ReactNode => {
  return (
    <a
      href={`tel:${value}`}
      onClick={(e) => e.stopPropagation()}
      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
    >
      <PhoneNumber value={String(value)} />
    </a>
  );
};

/**
 * Render URL field type (clickable external link)
 */
const renderUrl = (value: unknown): ReactNode => {
  return (
    <a
      href={String(value)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block"
    >
      {String(value)}
    </a>
  );
};

/**
 * Render date/datetime/timestamp field types
 */
const renderDate = (value: unknown, formatSmartTimestamp: (date: string) => string): ReactNode => {
  try {
    return (
      <span className="text-sm text-neutral-900">
        {formatSmartTimestamp(String(value))}
      </span>
    );
  } catch {
    return <span className="text-sm text-neutral-700">{String(value)}</span>;
  }
};

/**
 * Render boolean field type
 */
const renderBoolean = (value: unknown): ReactNode => {
  const boolValue = Boolean(value);
  return (
    <span className={`text-sm font-medium ${boolValue ? 'text-green-600' : 'text-neutral-400'}`}>
      {boolValue ? '✓' : '—'}
    </span>
  );
};

/**
 * Render enum field type (color-coded badge)
 */
const renderEnum = (value: unknown, schema: CustomFieldSchema, locale: string): ReactNode => {
  const stringValue = String(value);

  // Find matching option from schema
  const option = schema.options?.find(opt => opt.value === stringValue);

  // Select label based on locale
  const label = option
    ? (locale === 'ar' ? option.label_ar : option.label_en)
    : stringValue;

  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
      style={{
        backgroundColor: option?.color ? `${option.color}20` : '#f3f4f6',
        color: option?.color || '#374151',
      }}
    >
      {label}
    </span>
  );
};

/**
 * Main renderer - routes to appropriate type-specific renderer
 */
export const renderCustomFieldValue = (config: RenderConfig): ReactNode => {
  const { value, schema, formatSmartTimestamp, locale } = config;

  // Handle empty values
  if (isEmpty(value)) {
    return <EmptyPlaceholder />;
  }

  // Route to type-specific renderer
  switch (schema.field_type) {
    case 'string':
      return renderString(value);

    case 'text':
      return renderText(value);

    case 'number':
      return renderNumber(value);

    case 'currency':
      return renderCurrency(value);

    case 'email':
      return renderEmail(value);

    case 'phone':
      return renderPhone(value);

    case 'url':
      return renderUrl(value);

    case 'date':
    case 'datetime':
    case 'timestamp':
      return renderDate(value, formatSmartTimestamp);

    case 'boolean':
      return renderBoolean(value);

    case 'enum':
      return renderEnum(value, schema, locale);

    default:
      // Fallback to string rendering for unknown types
      return renderString(value);
  }
};

/**
 * Extract custom field value from lead object
 */
export const getCustomFieldValue = (lead: Lead, fieldKey: string): unknown => {
  return lead.customFields?.[fieldKey];
};

/**
 * Extract system field value from lead entity properties
 * Maps system field_key → lead.property (camelCase)
 */
export const getSystemFieldValue = (lead: Lead, fieldKey: string): unknown => {
  switch (fieldKey) {
    case 'name':
      return lead.name;
    case 'phone':
      return lead.phone;
    case 'summary':
      return lead.summary;
    case 'status':
      return lead.status;
    case 'notes':
      return lead.notes;
    case 'created_at':
      return lead.createdAt;
    default:
      return undefined;
  }
};

/**
 * Get optimal column width based on field type
 */
export const getColumnWidth = (fieldType: FieldType): string => {
  switch (fieldType) {
    case 'boolean':
      return '80px';

    case 'date':
    case 'datetime':
      return '140px';

    case 'currency':
    case 'number':
      return '120px';

    case 'email':
    case 'url':
      return '200px';

    case 'text':
      return '250px';

    case 'string':
    case 'phone':
    case 'timestamp':
    case 'enum':
    default:
      return '150px';
  }
};
