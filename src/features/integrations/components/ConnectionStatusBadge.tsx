import { useTranslation } from 'react-i18next';
import type { ConnectionStatus } from '../types';

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
}

const statusConfig: Record<ConnectionStatus, { labelKey: string; className: string }> = {
  active: {
    labelKey: 'integrations.status_active',
    className: 'bg-green-100 text-green-700',
  },
  error: {
    labelKey: 'integrations.status_error',
    className: 'bg-red-100 text-red-700',
  },
  disconnected: {
    labelKey: 'integrations.status_disconnected',
    className: 'bg-gray-100 text-gray-600',
  },
};

export default function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  const { t } = useTranslation();
  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {t(config.labelKey)}
    </span>
  );
}
