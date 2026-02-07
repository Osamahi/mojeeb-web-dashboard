import { useTranslation } from 'react-i18next';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import type { AdminConnectionListItem } from '../services/adminConnectionService';

interface AdminConnectionsTableProps {
  connections: AdminConnectionListItem[];
  isLoading: boolean;
  error: Error | null;
  onViewDetails: (connection: AdminConnectionListItem) => void;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  onPageChange?: (page: number) => void;
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  facebook: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Facebook' },
  instagram: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Instagram' },
  whatsapp: { bg: 'bg-green-100', text: 'text-green-700', label: 'WhatsApp' },
  tiktok: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'TikTok' },
  twitter: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Twitter' },
  linkedin: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'LinkedIn' },
};

export function AdminConnectionsTable({
  connections,
  isLoading,
  error,
  onViewDetails,
  pagination,
  onPageChange,
}: AdminConnectionsTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-200 border-t-primary-600"></div>
        <p className="mt-4 text-sm text-neutral-600">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-600">{t('common.error_loading_data')}</p>
        <p className="text-xs text-neutral-500 mt-2">{error.message}</p>
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-neutral-600">{t('connections.no_connections_found')}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                {t('connections.table.platform')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                {t('connections.table.account')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                {t('connections.table.agent')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                {t('connections.table.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                {t('connections.table.metadata')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                {t('connections.table.created')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {connections.map((connection) => {
              const platformConfig = PLATFORM_COLORS[connection.platform] || {
                bg: 'bg-neutral-100',
                text: 'text-neutral-700',
                label: connection.platform,
              };

              return (
                <tr
                  key={connection.id}
                  onClick={() => onViewDetails(connection)}
                  className="hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  {/* Platform */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${platformConfig.bg} ${platformConfig.text}`}
                    >
                      {platformConfig.label}
                    </span>
                  </td>

                  {/* Account */}
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      {connection.platformPictureUrl && (
                        <img
                          src={connection.platformPictureUrl}
                          alt={connection.platformAccountName || ''}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm font-medium text-neutral-900">
                            {connection.platform === 'whatsapp' && connection.platformAccountName ? (
                              <PhoneNumber value={connection.platformAccountName} className="inline" />
                            ) : (
                              connection.platformAccountName || t('common.unknown')
                            )}
                          </div>
                          {connection.platform === 'whatsapp' &&
                           connection.codeVerificationStatus !== 'VERIFIED' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                              {t('connections.details.pending_verification')}
                            </span>
                          )}
                        </div>
                        {connection.platformAccountHandle && (
                          <div className="text-xs text-neutral-500">
                            @{connection.platformAccountHandle}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Agent */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-neutral-900">
                      {connection.agentName || t('common.unknown')}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        connection.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {connection.isActive ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>

                  {/* Metadata */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-neutral-600 space-y-1">
                      {connection.followerCount !== null && (
                        <div>{connection.followerCount.toLocaleString()} {t('connections.table.followers')}</div>
                      )}
                      {connection.businessCategory && (
                        <div className="text-xs text-neutral-500">{connection.businessCategory}</div>
                      )}
                    </div>
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-600">
                      {format(new Date(connection.createdAt), 'MMM d, yyyy')}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(connection);
                      }}
                      className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      {t('common.view')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            {t('common.showing_x_of_y', {
              start: (pagination.page - 1) * pagination.pageSize + 1,
              end: Math.min(pagination.page * pagination.pageSize, pagination.totalCount),
              total: pagination.totalCount,
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrevious}
              className="inline-flex items-center px-3 py-1.5 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('common.previous')}
            </button>

            <span className="text-sm text-neutral-600">
              {t('common.page_x_of_y', {
                current: pagination.page,
                total: pagination.totalPages,
              })}
            </span>

            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="inline-flex items-center px-3 py-1.5 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
