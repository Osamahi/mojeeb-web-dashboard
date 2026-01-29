/**
 * CustomFieldsSection Component
 * Renders custom fields for a lead in both view and edit modes
 * Reusable across different lead-related components
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { LeadFieldDefinition } from '../types';

interface CustomFieldsSectionProps {
  customFields: Record<string, any>;
  fieldDefinitions?: LeadFieldDefinition[];
  readOnly?: boolean;
  onFieldChange?: (fieldKey: string, value: string) => void;
  errors?: Record<string, string>;
  initiallyExpanded?: boolean;
}

export function CustomFieldsSection({
  customFields,
  fieldDefinitions,
  readOnly = false,
  onFieldChange,
  errors,
  initiallyExpanded = false,
}: CustomFieldsSectionProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  // Don't render if no custom fields exist
  if (readOnly && (!customFields || Object.keys(customFields).length === 0)) {
    return null;
  }

  if (!readOnly && (!fieldDefinitions || fieldDefinitions.length === 0)) {
    return null;
  }

  return (
    <div className="border-t border-neutral-200 pt-4">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3 hover:bg-neutral-50 -mx-2 px-2 py-1 rounded transition-colors"
      >
        <h3 className="text-sm font-medium text-neutral-900">{t('lead_details.custom_fields')}</h3>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-neutral-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-neutral-500" />
        )}
      </button>

      {/* Fields Content */}
      {isExpanded && (
        <>
          {readOnly ? (
            /* View Mode - Read-only display */
            <div className="space-y-2">
              {Object.entries(customFields).map(([key, value]) => {
                const fieldDef = fieldDefinitions?.find((f) => f.fieldKey === key);
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-neutral-500 mb-1">
                      {fieldDef?.fieldLabel || key}
                    </label>
                    <p className="text-base text-neutral-900">{String(value) || '—'}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Edit Mode - Editable fields */
            <div className="space-y-3">
              {fieldDefinitions?.map((field) => (
                <div key={field.id}>
                  {field.fieldType === 'textarea' ? (
                    <Textarea
                      label={`${field.fieldLabel}${field.isRequired ? ' *' : ''}`}
                      value={customFields[field.fieldKey] || ''}
                      onChange={(e) => onFieldChange?.(field.fieldKey, e.target.value)}
                      error={errors?.[field.fieldKey]}
                    />
                  ) : field.fieldType === 'select' && field.options ? (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        {field.fieldLabel}
                        {field.isRequired && ' *'}
                      </label>
                      <select
                        value={customFields[field.fieldKey] || ''}
                        onChange={(e) => onFieldChange?.(field.fieldKey, e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      >
                        <option value="">{t('lead_details.select_placeholder')}</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors?.[field.fieldKey] && (
                        <p className="text-sm text-red-600 mt-1">{errors[field.fieldKey]}</p>
                      )}
                    </div>
                  ) : (
                    <Input
                      label={`${field.fieldLabel}${field.isRequired ? ' *' : ''}`}
                      type={
                        field.fieldType === 'email'
                          ? 'email'
                          : field.fieldType === 'phone'
                          ? 'tel'
                          : field.fieldType === 'date'
                          ? 'date'
                          : 'text'
                      }
                      value={customFields[field.fieldKey] || ''}
                      onChange={(e) => onFieldChange?.(field.fieldKey, e.target.value)}
                      error={errors?.[field.fieldKey]}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
