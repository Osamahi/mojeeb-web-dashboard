/**
 * Connection Health Badge Component
 * Displays health status indicators for platform connections
 */

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
  if (!shouldCheckHealth) return null;

  if (isHealthLoading) {
    return (
      <Clock
        className="w-4 h-4 text-neutral-400 animate-pulse"
        aria-label="Loading health status"
      />
    );
  }

  if (!healthStatus) return null;

  if (!healthStatus.tokenValid) {
    return (
      <AlertTriangle
        className="w-4 h-4 text-error"
        aria-label="Connection health critical: token invalid"
      />
    );
  }

  if (healthStatus.daysUntilExpiry !== null && healthStatus.daysUntilExpiry < EXPIRY_THRESHOLDS.WARNING) {
    return (
      <AlertTriangle
        className="w-4 h-4 text-warning"
        aria-label={`Connection health warning: token expires in ${healthStatus.daysUntilExpiry} days`}
      />
    );
  }

  return (
    <CheckCircle
      className="w-4 h-4 text-brand-green"
      aria-label="Connection health good"
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
  if (!shouldCheckHealth) return null;

  return (
    <div className="mt-3 space-y-1">
      {/* Meta platforms only notice */}
      <p className="text-xs text-neutral-400 italic">
        Health monitoring for Meta platforms only
      </p>

      {healthStatus && (
        <>
          {!healthStatus.tokenValid && (
            <p className="text-xs text-error flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Token expired or invalid
            </p>
          )}
          {healthStatus.tokenValid &&
            healthStatus.daysUntilExpiry !== null &&
            healthStatus.daysUntilExpiry < EXPIRY_THRESHOLDS.WARNING && (
              <p className="text-xs text-warning flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Token expires in {healthStatus.daysUntilExpiry} day{healthStatus.daysUntilExpiry !== 1 ? 's' : ''}
              </p>
            )}
          {!healthStatus.webhookSubscriptionActive && (
            <p className="text-xs text-warning flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Webhook subscription inactive
            </p>
          )}
          {healthStatus.error && (
            <p className="text-xs text-error">Error: {healthStatus.error}</p>
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
          {isHealthLoading ? 'Checking...' : 'Refresh Status'}
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
