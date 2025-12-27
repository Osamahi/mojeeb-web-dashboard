/**
 * Platform Connection Card Component
 * Displays a single platform connection with actions
 */

import { useState } from 'react';
import { Unplug } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { BaseModal } from '@/components/ui/BaseModal';
import { PlatformIcon } from './PlatformIcon';
import { ConnectionHealthIndicator, ConnectionHealthDetails } from './ConnectionHealthBadge';
import { useDisconnectPlatform, useConnectionHealth } from '../hooks/useConnections';
import { isMetaPlatform } from '../constants';
import type { PlatformConnection } from '../types';
import { PLATFORM_CONFIG } from '../types';

export interface PlatformConnectionCardProps {
  connection: PlatformConnection;
  showHealthStatus?: boolean;
}

export function PlatformConnectionCard({
  connection,
  showHealthStatus = false,
}: PlatformConnectionCardProps) {
  const { t } = useTranslation();
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const disconnectMutation = useDisconnectPlatform();

  // Only fetch health for Meta platforms
  const shouldCheckHealth = showHealthStatus && isMetaPlatform(connection.platform);

  const { data: healthStatus, isLoading: isHealthLoading, refetch: refetchHealth } = useConnectionHealth(
    shouldCheckHealth ? connection.id : undefined
  );

  const handleRefreshHealth = () => {
    if (shouldCheckHealth) {
      refetchHealth();
    }
  };

  const config = PLATFORM_CONFIG[connection.platform];
  const formattedDate = new Date(connection.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleDisconnect = () => {
    disconnectMutation.mutate(connection.id);
    setShowDisconnectModal(false);
  };

  return (
    <>
      <Card
        className={cn(
          'relative',
          !connection.isActive && 'opacity-60'
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Platform Icon or Account Avatar */}
            {connection.platformPictureUrl && !imageError ? (
              <Avatar
                src={connection.platformPictureUrl}
                alt={connection.platformAccountName || 'Account'}
                size="md"
                onError={() => setImageError(true)}
              />
            ) : (
              <PlatformIcon platform={connection.platform} size="lg" />
            )}

            <div className="flex-1 min-w-0">
              {/* Account Name */}
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-neutral-900 truncate">
                  {connection.platformAccountName || connection.platformAccountId}
                </h3>
                <ConnectionHealthIndicator
                  healthStatus={healthStatus}
                  isHealthLoading={isHealthLoading}
                  shouldCheckHealth={shouldCheckHealth}
                />
              </div>

              {/* Handle */}
              {connection.platformAccountHandle && (
                <p className="text-sm text-neutral-500 truncate">
                  {connection.platformAccountHandle}
                </p>
              )}

              {/* Platform and Status */}
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="default"
                  className="text-xs"
                  style={{
                    backgroundColor: config.bgColor,
                    color: config.color,
                    borderColor: config.color + '30',
                  }}
                >
                  {config.label}
                </Badge>
                <Badge variant={connection.isActive ? 'success' : 'danger'}>
                  {connection.isActive ? t('connection_card.active') : t('connection_card.inactive')}
                </Badge>
              </div>

              {/* Health Status Details */}
              <ConnectionHealthDetails
                healthStatus={healthStatus}
                shouldCheckHealth={shouldCheckHealth}
                onRefresh={handleRefreshHealth}
                isHealthLoading={isHealthLoading}
              />

              {/* Connected Date */}
              <p className="text-xs text-neutral-400 mt-2">{t('connection_card.connected_on', { date: formattedDate })}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {connection.isActive && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDisconnectModal(true)}
                disabled={disconnectMutation.isPending}
                className="text-error hover:text-error hover:border-error"
              >
                <Unplug className="w-4 h-4 mr-1" />
                {t('connection_card.disconnect_button')}
              </Button>
            )}
          </div>
        </div>

        {/* Parent Page Info for Instagram */}
        {connection.parentPageId && connection.platform === 'instagram' && (
          <div className="mt-3 pt-3 border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              {t('connection_card.instagram_parent_page', { pageId: connection.parentPageId })}
            </p>
          </div>
        )}
      </Card>

      {/* Disconnect Confirmation Modal */}
      <BaseModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        title={t('connection_card.disconnect_modal_title', { platform: config.label })}
        maxWidth="md"
        isLoading={disconnectMutation.isPending}
        closable={!disconnectMutation.isPending}
      >
        <div className="space-y-4">
          <p className="text-neutral-600">
            {t('connection_card.disconnect_modal_message', {
              account: connection.platformAccountName || connection.platformAccountId,
              platform: config.label
            })}
          </p>
          <p className="text-sm text-neutral-500">
            {t('connection_card.disconnect_warning')}
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowDisconnectModal(false)}>
              {t('connection_card.disconnect_cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? t('connection_card.disconnecting') : t('connection_card.disconnect_confirm')}
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
