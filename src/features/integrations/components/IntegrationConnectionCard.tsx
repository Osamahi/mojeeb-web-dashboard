import { useTranslation } from 'react-i18next';
import { Trash2, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { useDateLocale } from '@/lib/dateConfig';
import type { IntegrationConnection } from '../types';
import ConnectionStatusBadge from './ConnectionStatusBadge';
import TestConnectionButton from './TestConnectionButton';

interface IntegrationConnectionCardProps {
  connection: IntegrationConnection;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const connectorIcons: Record<string, typeof FileSpreadsheet> = {
  google_sheets: FileSpreadsheet,
};

const connectorLabels: Record<string, string> = {
  google_sheets: 'Google Sheets',
};

export default function IntegrationConnectionCard({
  connection,
  onDelete,
  isDeleting,
}: IntegrationConnectionCardProps) {
  const { t } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();
  const Icon = connectorIcons[connection.connectorType] || FileSpreadsheet;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-neutral-900">
              {connection.name}
            </h3>
            <p className="text-xs text-neutral-500">
              {connectorLabels[connection.connectorType] || connection.connectorType}
            </p>
          </div>
        </div>

        {/* Right: status badge */}
        <ConnectionStatusBadge status={connection.status} />
      </div>

      {connection.description && (
        <p className="mt-3 text-sm text-neutral-600 line-clamp-2">{connection.description}</p>
      )}

      {/* Config summary */}
      {connection.config?.spreadsheet_id && (
        <div className="mt-3 rounded-md bg-neutral-50 px-3 py-2">
          <p className="text-xs text-neutral-500">
            {t('integrations.spreadsheet_id')}: <span className="font-mono text-neutral-700">{connection.config.spreadsheet_id}</span>
          </p>
        </div>
      )}

      {/* Token expired warning */}
      {connection.isTokenExpired && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-700">{t('integrations.token_expired')}</p>
        </div>
      )}

      {/* Error display */}
      {connection.lastError && (
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600 line-clamp-2">{connection.lastError}</p>
        </div>
      )}

      {/* Footer: metadata + actions */}
      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
        <div className="text-xs text-neutral-400">
          {connection.lastTestedAt
            ? `${t('integrations.last_tested')}: ${formatSmartTimestamp(connection.lastTestedAt)}`
            : `${t('integrations.created')}: ${formatSmartTimestamp(connection.createdAt)}`
          }
        </div>
        <div className="flex items-center gap-2">
          <TestConnectionButton connectionId={connection.id} />
          <button
            onClick={() => onDelete(connection.id)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
