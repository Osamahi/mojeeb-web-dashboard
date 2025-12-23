/**
 * Health Check Dialog
 * Displays connection health status for Meta platforms (Facebook/Instagram)
 */

import { CheckCircle, AlertCircle, XCircle, Clock, Shield } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import type { PlatformConnection, ConnectionHealthStatus } from '../../types';
import { getPlatformById } from '../../constants/platforms';

export interface HealthCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  connection: PlatformConnection | null;
  healthStatus: ConnectionHealthStatus | null;
  isLoading?: boolean;
  error?: Error | null;
}

export function HealthCheckDialog({
  isOpen,
  onClose,
  connection,
  healthStatus,
  isLoading = false,
  error = null,
}: HealthCheckDialogProps) {
  if (!connection) return null;

  const platform = getPlatformById(connection.platform);
  const accountName = connection.platformAccountName || connection.platformAccountHandle || 'Account';

  // Determine overall health status
  const isHealthy = healthStatus?.tokenValid && healthStatus?.webhookSubscriptionActive;
  const hasWarning = healthStatus?.daysUntilExpiry !== null && healthStatus?.daysUntilExpiry !== undefined && healthStatus.daysUntilExpiry < 30;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Connection Health Check"
      maxWidth="md"
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: platform?.brandBgColor }}
          >
            <div className="text-2xl">{platform?.name.charAt(0)}</div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 truncate">{accountName}</h3>
            <p className="text-sm text-neutral-600">{platform?.name}</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D084]"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900">Failed to check health</p>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        )}

        {/* Health Status */}
        {!isLoading && !error && healthStatus && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div
              className={`flex items-center gap-3 p-4 rounded-lg border ${
                isHealthy
                  ? 'bg-green-50 border-green-200'
                  : hasWarning
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              {isHealthy ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : hasWarning ? (
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    isHealthy
                      ? 'text-green-900'
                      : hasWarning
                      ? 'text-orange-900'
                      : 'text-red-900'
                  }`}
                >
                  {isHealthy
                    ? 'Connection is healthy'
                    : hasWarning
                    ? 'Action required soon'
                    : 'Connection issues detected'}
                </p>
                {healthStatus.error && (
                  <p className="text-sm text-red-700 mt-1">{healthStatus.error}</p>
                )}
              </div>
            </div>

            {/* Token Status */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-900">Access Token</h4>
              <div className="flex items-start gap-3">
                {healthStatus.tokenValid ? (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-neutral-900">
                    {healthStatus.tokenValid ? 'Valid and active' : 'Invalid or expired'}
                  </p>
                  {healthStatus.tokenExpiresAt && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      <p className="text-xs text-neutral-600">
                        {healthStatus.daysUntilExpiry !== null && healthStatus.daysUntilExpiry > 0
                          ? `Expires in ${healthStatus.daysUntilExpiry} days`
                          : 'Expired'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Webhook Status */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-900">Webhook Subscription</h4>
              <div className="flex items-start gap-3">
                {healthStatus.webhookSubscriptionActive ? (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-neutral-900">
                    {healthStatus.webhookSubscriptionActive
                      ? 'Active and receiving messages'
                      : 'Not subscribed or inactive'}
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions */}
            {healthStatus.permissions && healthStatus.permissions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-neutral-900">Granted Permissions</h4>
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {healthStatus.permissions.map((permission, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-neutral-200">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
