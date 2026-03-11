import { Trash2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ColumnMappingEntry } from '@/features/integrations/types';
import { headerToVariableName } from '../utils/integrationUtils';

interface ColumnMappingBuilderProps {
  columns: ColumnMappingEntry[];
  onChange: (columns: ColumnMappingEntry[]) => void;
}

const SOURCE_TYPES = [
  { value: 'variable', label: 'Variable' },
  { value: 'auto_increment', label: 'Auto Increment' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'static', label: 'Static Value' },
] as const;

export function ColumnMappingBuilder({ columns, onChange }: ColumnMappingBuilderProps) {
  const { t } = useTranslation();

  const updateColumn = (index: number, updates: Partial<ColumnMappingEntry>) => {
    const updated = columns.map((col, i) => (i === index ? { ...col, ...updates } : col));
    onChange(updated);
  };

  const removeColumn = (index: number) => {
    onChange(columns.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    onChange([
      ...columns,
      {
        source: 'variable',
        header: '',
        variable_name: '',
        enabled: true,
      },
    ]);
  };

  const toggleColumn = (index: number) => {
    updateColumn(index, { enabled: !columns[index].enabled });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700">
        {t('integrations.column_mapping', 'Column Mapping')} *
      </label>
      <p className="text-xs text-neutral-500 mb-2">
        {t('integrations.column_mapping_hint', 'Map each sheet column to a data source. Variable names are what the AI extracts from conversation.')}
      </p>

      <div className="space-y-2">
        {columns.map((col, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 p-2.5 rounded-lg border transition-colors ${
              col.enabled ? 'border-neutral-200 bg-white' : 'border-neutral-100 bg-neutral-50 opacity-60'
            }`}
          >
            {/* Enable toggle */}
            <input
              type="checkbox"
              checked={col.enabled}
              onChange={() => toggleColumn(index)}
              className="mt-2 w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 shrink-0"
            />

            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-2 min-w-0">
              {/* Column header name */}
              <input
                type="text"
                value={col.header || ''}
                onChange={(e) => {
                  const header = e.target.value;
                  const updates: Partial<ColumnMappingEntry> = { header };
                  if (col.source === 'variable' && !col.variable_name) {
                    updates.variable_name = headerToVariableName(header);
                  }
                  updateColumn(index, updates);
                }}
                placeholder={t('integrations.column_name', 'Column name')}
                className="px-2.5 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={!col.enabled}
              />

              {/* Source type */}
              <select
                value={col.source}
                onChange={(e) => updateColumn(index, { source: e.target.value as ColumnMappingEntry['source'] })}
                className="px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={!col.enabled}
              >
                {SOURCE_TYPES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>

              {/* Value field — depends on source type */}
              {col.source === 'variable' && (
                <input
                  type="text"
                  value={col.variable_name || ''}
                  onChange={(e) => updateColumn(index, { variable_name: e.target.value })}
                  placeholder={t('integrations.variable_name', 'e.g., customer_name')}
                  className="px-2.5 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!col.enabled}
                />
              )}
              {col.source === 'auto_increment' && (
                <input
                  type="text"
                  value={col.prefix || ''}
                  onChange={(e) => updateColumn(index, { prefix: e.target.value })}
                  placeholder={t('integrations.prefix', 'Prefix, e.g., MOJ')}
                  className="px-2.5 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!col.enabled}
                />
              )}
              {col.source === 'timestamp' && (
                <input
                  type="text"
                  value={col.format || 'yyyy-MM-dd HH:mm'}
                  onChange={(e) => updateColumn(index, { format: e.target.value })}
                  placeholder="yyyy-MM-dd HH:mm"
                  className="px-2.5 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!col.enabled}
                />
              )}
              {col.source === 'static' && (
                <input
                  type="text"
                  value={col.value || ''}
                  onChange={(e) => updateColumn(index, { value: e.target.value })}
                  placeholder={t('integrations.static_value', 'Static value')}
                  className="px-2.5 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!col.enabled}
                />
              )}
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeColumn(index)}
              className="mt-1.5 p-1 text-neutral-400 hover:text-red-500 transition-colors shrink-0"
              title={t('common.delete', 'Delete')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addColumn}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors mt-1"
      >
        <Plus size={14} />
        {t('integrations.add_column', 'Add Column')}
      </button>
    </div>
  );
}
