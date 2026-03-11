import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useIntegrationConnections, useSheetMetadata } from '@/features/integrations/hooks/useIntegrations';
import { ColumnMappingBuilder } from './ColumnMappingBuilder';
import type { ColumnMappingEntry } from '@/features/integrations/types';
import { headerToVariableName } from '../utils/integrationUtils';

/**
 * Integration config stored in action_config JSONB.
 * Note: connectionId and connectorType are NO LONGER part of action_config —
 * they live on the actions.integration_connection_id FK column.
 */
export interface IntegrationConfigValue {
  targetTab: string;
  columnMapping: ColumnMappingEntry[];
}

interface IntegrationActionConfigProps {
  connectionId: string;
  onConnectionChange: (connectionId: string) => void;
  value: IntegrationConfigValue;
  onChange: (value: IntegrationConfigValue) => void;
  onAutoFill?: (fields: { name?: string; description?: string; triggerPrompt?: string }) => void;
}

export function IntegrationActionConfig({ connectionId, onConnectionChange, value, onChange, onAutoFill }: IntegrationActionConfigProps) {
  const { t } = useTranslation();
  const { data: connections, isLoading: connectionsLoading } = useIntegrationConnections();
  const { data: sheetMetadata, isLoading: metadataLoading } = useSheetMetadata(
    connectionId || null
  );

  const activeConnections = useMemo(
    () => connections?.filter((c) => c.status === 'active') || [],
    [connections]
  );

  const selectedConnection = useMemo(
    () => activeConnections.find((c) => c.id === connectionId),
    [activeConnections, connectionId]
  );

  const tabs = sheetMetadata?.tabs || [];
  const selectedTab = tabs.find((tab) => tab.name === value.targetTab);

  // Keep a ref to the latest value to avoid stale closures in effects
  const valueRef = useRef(value);
  valueRef.current = value;

  // Auto-select first tab when metadata loads
  useEffect(() => {
    const current = valueRef.current;
    if (tabs.length > 0 && !current.targetTab) {
      onChange({ ...current, targetTab: tabs[0].name });
    }
  }, [tabs, value.targetTab, onChange]);

  // Auto-populate column mapping from headers when tab changes
  useEffect(() => {
    const current = valueRef.current;
    if (selectedTab && selectedTab.headers.length > 0 && current.columnMapping.length === 0) {
      const newMapping: ColumnMappingEntry[] = selectedTab.headers.map((header) => ({
        source: 'variable' as const,
        header,
        variable_name: headerToVariableName(header),
        enabled: true,
      }));
      onChange({ ...current, columnMapping: newMapping });

      // Auto-generate trigger prompt and name
      if (onAutoFill) {
        const variableNames = newMapping
          .filter((m) => m.source === 'variable' && m.variable_name)
          .map((m) => m.variable_name);
        const connectionName = selectedConnection?.name || 'Google Sheet';
        const tabName = selectedTab.name;

        onAutoFill({
          name: `Save to ${connectionName} - ${tabName}`,
          description: `Appends a row to Google Sheets tab "${tabName}" when data is collected from conversation`,
          triggerPrompt: variableNames.length > 0
            ? `When the customer provides their ${variableNames.join(', ')}, extract these details as variables and add a new row to the Google Sheet.`
            : `When the customer provides the required information, extract the details and add a new row to the Google Sheet.`,
        });
      }
    }
  }, [selectedTab?.name, onChange, onAutoFill, selectedConnection?.name]);

  const handleConnectionChange = (newConnectionId: string) => {
    onConnectionChange(newConnectionId);
    onChange({ targetTab: '', columnMapping: [] });
  };

  const handleTabChange = (tabName: string) => {
    onChange({ ...value, targetTab: tabName, columnMapping: [] });
  };

  return (
    <div className="space-y-4">
      {/* Connection Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {t('integrations.select_connection', 'Google Sheets Connection')} *
        </label>
        {connectionsLoading ? (
          <div className="flex items-center gap-2 text-sm text-neutral-500 py-2">
            <Loader2 size={14} className="animate-spin" />
            {t('common.loading', 'Loading...')}
          </div>
        ) : activeConnections.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            {t('integrations.no_active_connections', 'No active Google Sheets connections found. Create one in the Integrations page first.')}
          </p>
        ) : (
          <select
            value={connectionId}
            onChange={(e) => handleConnectionChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t('integrations.select_connection_placeholder', '-- Select a connection --')}</option>
            {activeConnections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name} {conn.config?.spreadsheet_id ? `(${conn.config.spreadsheet_id.substring(0, 12)}...)` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tab Selection */}
      {connectionId && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('integrations.select_tab', 'Sheet Tab')} *
          </label>
          {metadataLoading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500 py-2">
              <Loader2 size={14} className="animate-spin" />
              {t('integrations.loading_tabs', 'Loading sheet tabs...')}
            </div>
          ) : tabs.length === 0 ? (
            <p className="text-sm text-neutral-500">{t('integrations.no_tabs', 'No tabs found')}</p>
          ) : (
            <>
              {sheetMetadata?.spreadsheet_title && (
                <p className="text-xs text-neutral-500 mb-1.5">
                  {sheetMetadata.spreadsheet_title}
                </p>
              )}
              <select
                value={value.targetTab}
                onChange={(e) => handleTabChange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {tabs.map((tab) => (
                  <option key={tab.name} value={tab.name}>
                    {tab.name} {tab.headers.length > 0 ? `(${tab.headers.length} columns)` : '(empty)'}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {/* Column Mapping */}
      {value.targetTab && (
        <ColumnMappingBuilder
          columns={value.columnMapping}
          onChange={(columnMapping) => onChange({ ...value, columnMapping })}
        />
      )}
    </div>
  );
}

/**
 * Serialize IntegrationConfigValue to action_config JSON object.
 * Note: connection_id and connector_type are no longer included —
 * they are handled by the integration_connection_id column.
 */
export function serializeIntegrationConfig(config: IntegrationConfigValue): Record<string, any> {
  const enabledColumns = config.columnMapping.filter((col) => col.enabled);
  const columnMapping = enabledColumns.map((col) => {
    const entry: Record<string, any> = { source: col.source };
    if (col.header) entry.header = col.header;
    if (col.source === 'variable') {
      entry.variable_name = col.variable_name || '';
      if (col.default) entry.default = col.default;
    }
    if (col.source === 'auto_increment') entry.prefix = col.prefix || 'MOJ';
    if (col.source === 'timestamp') entry.format = col.format || 'yyyy-MM-dd HH:mm';
    if (col.source === 'static') entry.value = col.value || '';
    return entry;
  });

  return {
    target_tab: config.targetTab,
    column_mapping: columnMapping,
  };
}

/**
 * Deserialize action_config JSON object to IntegrationConfigValue.
 * Note: connectionId is now read from action.integrationConnectionId, not from action_config.
 */
export function deserializeIntegrationConfig(actionConfig: Record<string, any>): IntegrationConfigValue {
  const rawMapping = actionConfig.column_mapping || [];
  const columnMapping: ColumnMappingEntry[] = rawMapping.map((entry: any) => ({
    source: entry.source || 'variable',
    header: entry.header || '',
    variable_name: entry.variable_name || '',
    prefix: entry.prefix || '',
    format: entry.format || '',
    value: entry.value || '',
    default: entry.default || '',
    enabled: true,
  }));

  return {
    targetTab: actionConfig.target_tab || '',
    columnMapping,
  };
}
