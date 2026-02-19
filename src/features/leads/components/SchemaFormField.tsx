/**
 * SchemaFormField Component
 * Unified form field renderer for custom_field_schemas
 *
 * Renders any schema (system or custom) as either:
 * - Edit mode: Appropriate form input based on field_type
 * - View mode: Read-only display of the value
 *
 * Supports all 12 field types with bilingual labels (en/ar)
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { useDateLocale } from '@/lib/dateConfig';
import type { CustomFieldSchema } from '../types/customFieldSchema.types';

interface SchemaFormFieldProps {
  schema: CustomFieldSchema;
  value: any;
  onChange: (value: string) => void;
  error?: string;
  readOnly?: boolean;
}

/**
 * Get bilingual label from schema
 */
function useSchemaLabel(schema: CustomFieldSchema): string {
  const { i18n } = useTranslation();
  const label = i18n.language === 'ar' ? schema.name_ar : schema.name_en;
  return schema.is_required ? `${label} *` : label;
}

/**
 * Read-only display of a field value
 */
function SchemaFieldViewMode({
  schema,
  value,
}: {
  schema: CustomFieldSchema;
  value: any;
}) {
  const { i18n } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();
  const label = i18n.language === 'ar' ? schema.name_ar : schema.name_en;

  const isEmpty = value === null || value === undefined || value === '';

  // Render the value based on field_type
  const renderValue = () => {
    if (isEmpty) return <p className="text-base text-neutral-400">—</p>;

    switch (schema.field_type) {
      case 'phone':
        return <PhoneNumber value={String(value)} className="text-base text-neutral-900" />;

      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-base text-blue-600 hover:underline">
            {String(value)}
          </a>
        );

      case 'url':
        return (
          <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-base text-blue-600 hover:underline">
            {String(value)}
          </a>
        );

      case 'boolean':
        return <p className="text-base text-neutral-900">{value ? 'Yes' : 'No'}</p>;

      case 'enum': {
        const option = schema.options?.find(opt => opt.value === String(value));
        const displayLabel = option
          ? (i18n.language === 'ar' ? option.label_ar : option.label_en)
          : String(value);
        return <p className="text-base text-neutral-900 capitalize">{displayLabel}</p>;
      }

      case 'date':
      case 'datetime':
      case 'timestamp':
        try {
          return <p className="text-xs text-neutral-400">{formatSmartTimestamp(String(value))}</p>;
        } catch {
          return <p className="text-base text-neutral-900">{String(value)}</p>;
        }

      case 'text':
        return <p className="text-base text-neutral-900 whitespace-pre-wrap">{String(value)}</p>;

      default:
        return <p className="text-base text-neutral-900">{String(value)}</p>;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-500 mb-1">
        {label}
      </label>
      {renderValue()}
    </div>
  );
}

/**
 * Edit mode form input based on field_type
 */
function SchemaFieldEditMode({
  schema,
  value,
  onChange,
  error,
}: {
  schema: CustomFieldSchema;
  value: any;
  onChange: (value: string) => void;
  error?: string;
}) {
  const { t, i18n } = useTranslation();
  const label = useSchemaLabel(schema);

  switch (schema.field_type) {
    case 'text':
      return (
        <Textarea
          label={label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          rows={3}
        />
      );

    case 'enum':
      return (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {label}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          >
            <option value="">{t('leads.select_placeholder')}</option>
            {schema.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {i18n.language === 'ar' ? opt.label_ar : opt.label_en}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
      );

    case 'boolean':
      return (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked ? 'true' : '')}
              className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
            />
            {label}
          </label>
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
      );

    case 'number':
      return (
        <Input
          label={label}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      );

    case 'currency':
      return (
        <Input
          label={label}
          type="number"
          step="0.01"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      );

    case 'email':
      return (
        <Input
          label={label}
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      );

    case 'phone':
      return (
        <Input
          label={label}
          type="tel"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      );

    case 'url':
      return (
        <Input
          label={label}
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      );

    case 'date':
      return (
        <Input
          label={label}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      );

    case 'datetime':
      return (
        <Input
          label={label}
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      );

    // timestamp is display-only in forms (created_at, updated_at)
    case 'timestamp':
      return (
        <Input
          label={label}
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          disabled
        />
      );

    // string and all other types → text input
    case 'string':
    default:
      return (
        <Input
          label={label}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      );
  }
}

/**
 * Unified schema form field — switches between edit and view modes
 */
export function SchemaFormField({
  schema,
  value,
  onChange,
  error,
  readOnly = false,
}: SchemaFormFieldProps) {
  if (readOnly) {
    return <SchemaFieldViewMode schema={schema} value={value} />;
  }

  return (
    <SchemaFieldEditMode
      schema={schema}
      value={value}
      onChange={onChange}
      error={error}
    />
  );
}
