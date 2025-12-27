/**
 * Connection Health Badge Component
 * Displays health status indicators for platform connections
 */

import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EXPIRY_THRESHOLDS } from '../constants';
import type { ConnectionHealthStatus } from '../types';

export interface ConnectionHealthBadgeProps {
  healthStatus: ConnectionHealthStatus | undefined;
  isHealthLoading: boolean;
  shouldCheckHealth: boolean;
  onRefresh?: () => void;
}

/**
 * Inline health indicator icon
 */
export function ConnectionHealthIndicator({
  healthStatus,
  isHealthLoading,
  shouldCheckHealth,
}: ConnectionHealthBadgeProps) {
  const { t } = useTranslation();

  if (!shouldCheckHealth) return null;

  if (isHealthLoading) {
    return (
      <Clock
        className="w-4 h-4 text-neutral-400 animate-pulse"
        aria-label={t('connection_health.loading')}
      />
    );
  }

  if (!healthStatus) return null;

  if (!healthStatus.tokenValid) {
    return (
      <AlertTriangle
        className="w-4 h-4 text-error"
        aria-label={t('connection_health.critical_token_invalid')}
      />
    );
  }

  if (healthStatus.daysUntilExpiry !== null && healthStatus.daysUntilExpiry < EXPIRY_THRESHOLDS.WARNING) {
    return (
      <AlertTriangle
        className="w-4 h-4 text-warning"
        aria-label={t('connection_health.warning_token_expires', { days: healthStatus.daysUntilExpiry })}
      />
    );
  }

  return (
    <CheckCircle
      className="w-4 h-4 text-brand-green"
      aria-label={t('connection_health.health_good')}
    />
  );
}

/**
 * Detailed health status section
 */
export function ConnectionHealthDetails({
  healthStatus,
  shouldCheckHealth,
  onRefresh,
  isHealthLoading,
}: Pick<ConnectionHealthBadgeProps, 'healthStatus' | 'shouldCheckHealth' | 'onRefresh' | 'isHealthLoading'>) {
  const { t } = useTranslation();

  if (!shouldCheckHealth) return null;

  return (
    <div className="mt-3 space-y-1">
      {/* Meta platforms only notice */}
      <p className="text-xs text-neutral-400 italic">
        {t('connection_health.meta_platforms_only')}
      </p>

      {healthStatus && (
        <>
          {!healthStatus.tokenValid && (
            <p className="text-xs text-error flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t('connection_health.token_expired')}
            </p>
          )}
          {healthStatus.tokenValid &&
            healthStatus.daysUntilExpiry !== null &&
            healthStatus.daysUntilExpiry < EXPIRY_THRESHOLDS.WARNING && (
              <p className="text-xs text-warning flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('connection_health.token_expires_in', {
                  days: healthStatus.daysUntilExpiry,
                  count: healthStatus.daysUntilExpiry
                })}
              </p>
            )}
          {!healthStatus.webhookSubscriptionActive && (
            <p className="text-xs text-warning flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t('connection_health.webhook_inactive')}
            </p>
          )}
          {healthStatus.error && (
            <p className="text-xs text-error">{t('connection_health.error', { message: healthStatus.error })}</p>
          )}
        </>
      )}

      {/* Refresh button */}
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isHealthLoading}
          className="text-xs h-6 px-2 mt-1"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isHealthLoading ? 'animate-spin' : ''}`} />
          {isHealthLoading ? t('connection_health.checking') : t('connection_health.refresh_status')}
        </Button>
      )}
    </div>
  );
}

/**
 * Combined health badge (indicator + details)
 * Use this when you need both parts together
 */
export function ConnectionHealthBadge(props: ConnectionHealthBadgeProps) {
  return (
    <>
      <ConnectionHealthIndicator {...props} />
      <ConnectionHealthDetails
        healthStatus={props.healthStatus}
        shouldCheckHealth={props.shouldCheckHealth}
        onRefresh={props.onRefresh}
        isHealthLoading={props.isHealthLoading}
      />
    </>
  );
}
