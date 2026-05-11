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

// The column set is FIXED to whatever headers the picked sheet/tab gave us.
// We dropped the "Add Column" affordance (you can't introduce a column that
// doesn't exist in the spreadsheet — it'd never get written) and dropped the
// trash button (the checkbox is the sole on/off affordance for whether the
// AI should fill that column). Power users who want to add genuinely new
// columns do it in Google Sheets itself, then reconnect / refresh metadata.
export function ColumnMappingBuilder({ columns, onChange }: ColumnMappingBuilderProps) {
  const { t } = useTranslation();

  const updateColumn = (index: number, updates: Partial<ColumnMappingEntry>) => {
    const updated = columns.map((col, i) => (i === index ? { ...col, ...updates } : col));
    onChange(updated);
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
            {/* Enable toggle — `accent-brand-mojeeb` colors the native checkbox
                with our brand green instead of the browser default blue.
                Sole on/off affordance: no trash button, since the column set
                is locked to the sheet's actual headers. */}
            <input
              type="checkbox"
              checked={col.enabled}
              onChange={() => toggleColumn(index)}
              className="mt-2 w-4 h-4 accent-brand-mojeeb border-neutral-300 rounded focus:ring-brand-mojeeb shrink-0"
            />

            {/* Grid layout for the three input columns.
                `min-w-0` on each cell is critical — without it, long input
                values (e.g. "mobile_number") push the cell past its grid track.
                Default `grid` track sizing won't shrink-below-content unless
                children opt in to `min-w-0`. */}
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
                className="min-w-0 px-2.5 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-brand-mojeeb focus:border-brand-mojeeb"
                disabled={!col.enabled}
              />

              {/* Source type */}
              <select
                value={col.source}
                onChange={(e) => updateColumn(index, { source: e.target.value as ColumnMappingEntry['source'] })}
                className="min-w-0 px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-brand-mojeeb focus:border-brand-mojeeb"
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
                  className="min-w-0 px-2.5 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-brand-mojeeb focus:border-brand-mojeeb"
                  disabled={!col.enabled}
                />
              )}
              {col.source === 'auto_increment' && (
                <input
                  type="text"
                  value={col.prefix || ''}
                  onChange={(e) => updateColumn(index, { prefix: e.target.value })}
                  placeholder={t('integrations.prefix', 'Prefix, e.g., MOJ')}
                  className="min-w-0 px-2.5 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-brand-mojeeb focus:border-brand-mojeeb"
                  disabled={!col.enabled}
                />
              )}
              {col.source === 'timestamp' && (
                <input
                  type="text"
                  value={col.format || 'yyyy-MM-dd HH:mm'}
                  onChange={(e) => updateColumn(index, { format: e.target.value })}
                  placeholder="yyyy-MM-dd HH:mm"
                  className="min-w-0 px-2.5 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-brand-mojeeb focus:border-brand-mojeeb"
                  disabled={!col.enabled}
                />
              )}
              {col.source === 'static' && (
                <input
                  type="text"
                  value={col.value || ''}
                  onChange={(e) => updateColumn(index, { value: e.target.value })}
                  placeholder={t('integrations.static_value', 'Static value')}
                  className="min-w-0 px-2.5 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-brand-mojeeb focus:border-brand-mojeeb"
                  disabled={!col.enabled}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
