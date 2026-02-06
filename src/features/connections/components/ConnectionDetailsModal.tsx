import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { TestTube2 } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { adminConnectionService } from '../services/adminConnectionService';

interface ConnectionDetailsModalProps {
  connectionId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  facebook: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Facebook' },
  instagram: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Instagram' },
  whatsapp: { bg: 'bg-green-100', text: 'text-green-700', label: 'WhatsApp' },
  tiktok: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'TikTok' },
  twitter: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Twitter' },
  linkedin: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'LinkedIn' },
};

export function ConnectionDetailsModal({
  connectionId,
  isOpen,
  onClose,
}: ConnectionDetailsModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: connection, isLoading } = useQuery({
    queryKey: ['admin-connection-details', connectionId],
    queryFn: () => adminConnectionService.getConnectionDetails(connectionId),
    enabled: isOpen,
  });

  const platformConfig = connection
    ? PLATFORM_COLORS[connection.platform] || {
        bg: 'bg-neutral-100',
        text: 'text-neutral-700',
        label: connection.platform,
      }
    : null;

  const handleTestToken = () => {
    navigate(`/meta-token-examiner?connectionId=${connectionId}`);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('connections.details.modal_title')}
      maxWidth="2xl"
      isLoading={isLoading}
    >
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {/* Platform Info Skeleton */}
          <div>
            <div className="h-4 bg-neutral-200 rounded w-32 mb-3"></div>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-neutral-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-neutral-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-neutral-200 rounded w-48"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-200">
                <div>
                  <div className="h-3 bg-neutral-200 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-32"></div>
                </div>
                <div>
                  <div className="h-3 bg-neutral-200 rounded w-16 mb-2"></div>
                  <div className="h-6 bg-neutral-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Agent & Organization Skeleton */}
          <div>
            <div className="h-4 bg-neutral-200 rounded w-40 mb-3"></div>
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="h-3 bg-neutral-200 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-32"></div>
                </div>
                <div>
                  <div className="h-3 bg-neutral-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps Skeleton */}
          <div>
            <div className="h-4 bg-neutral-200 rounded w-24 mb-3"></div>
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="h-3 bg-neutral-200 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-40"></div>
                </div>
                <div>
                  <div className="h-3 bg-neutral-200 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-40"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : connection ? (
        <div className="space-y-6">
          {/* Platform Info */}
          <div>
            <h3 className="text-sm font-medium text-neutral-900 mb-3">
              {t('connections.details.platform_info')}
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                {connection.platformPictureUrl && (
                  <img
                    src={connection.platformPictureUrl}
                    alt={connection.platformAccountName || ''}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${platformConfig?.bg} ${platformConfig?.text}`}
                  >
                    {platformConfig?.label}
                  </span>
                  <div className="mt-2 text-lg font-semibold text-neutral-900">
                    {connection.platformAccountName || t('common.unknown')}
                  </div>
                  {connection.platformAccountHandle && (
                    <div className="text-sm text-neutral-500">
                      @{connection.platformAccountHandle}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-200">
                <div>
                  <div className="text-xs text-neutral-500">
                    {t('connections.details.account_id')}
                  </div>
                  <div className="text-sm font-mono text-neutral-900">
                    {connection.platformAccountId}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500">{t('connections.details.status')}</div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      connection.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {connection.isActive ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Agent & Organization Info */}
          <div>
            <h3 className="text-sm font-medium text-neutral-900 mb-3">
              {t('connections.details.agent_organization')}
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-500">{t('connections.details.agent')}</div>
                  <div className="text-sm text-neutral-900">
                    {connection.agentName || t('common.unknown')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500">
                    {t('connections.details.organization')}
                  </div>
                  <div className="text-sm text-neutral-900">
                    {connection.organizationName || t('common.none')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          {(connection.businessId || connection.businessName || connection.parentPageId) && (
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-3">
                {t('connections.details.business_info')}
              </h3>
              <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                {connection.businessName && (
                  <div>
                    <div className="text-xs text-neutral-500">
                      {t('connections.details.business_name')}
                    </div>
                    <div className="text-sm text-neutral-900">{connection.businessName}</div>
                  </div>
                )}
                {connection.businessId && (
                  <div>
                    <div className="text-xs text-neutral-500">
                      {t('connections.details.business_id')}
                    </div>
                    <div className="text-sm font-mono text-neutral-900">{connection.businessId}</div>
                  </div>
                )}
                {connection.parentPageId && (
                  <div>
                    <div className="text-xs text-neutral-500">
                      {t('connections.details.parent_page_id')}
                    </div>
                    <div className="text-sm font-mono text-neutral-900">
                      {connection.parentPageId}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {connection.platformMetadata && Object.keys(connection.platformMetadata).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-3">
                {t('connections.details.platform_metadata')}
              </h3>
              <div className="bg-neutral-50 rounded-lg p-4">
                <pre className="text-xs text-neutral-700 overflow-x-auto">
                  {JSON.stringify(connection.platformMetadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Token Information */}
          {connection.tokenExpiresAt && (
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-3">
                {t('connections.details.token_info')}
              </h3>
              <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                <div>
                  <div className="text-xs text-neutral-500">
                    {t('connections.details.token_expires_at')}
                  </div>
                  <div className="text-sm text-neutral-900">
                    {format(new Date(connection.tokenExpiresAt), 'PPpp')}
                  </div>
                </div>
                {connection.webhookSecret && (
                  <div>
                    <div className="text-xs text-neutral-500">
                      {t('connections.details.webhook_secret')}
                    </div>
                    <div className="text-sm font-mono text-neutral-900">
                      {connection.webhookSecret}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-medium text-neutral-900 mb-3">
              {t('connections.details.timestamps')}
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-500">{t('common.created_at')}</div>
                  <div className="text-sm text-neutral-900">
                    {format(new Date(connection.createdAt), 'PPpp')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500">{t('common.updated_at')}</div>
                  <div className="text-sm text-neutral-900">
                    {format(new Date(connection.updatedAt), 'PPpp')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <button
              onClick={handleTestToken}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-neutral-800 transition-colors flex items-center gap-2"
            >
              <TestTube2 className="w-4 h-4" />
              {t('connections.details.test_token')}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-neutral-500">
          <p>{t('connections.no_connections_found')}</p>
        </div>
      )}
    </BaseModal>
  );
}
