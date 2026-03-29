import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-200 rounded-full shrink-0" />
          <div className="space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-32" />
            <div className="h-3 bg-neutral-200 rounded w-20" />
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-24" />
          <div className="h-3 bg-neutral-200 rounded w-16" />
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-1.5">
          <div className="h-3 bg-neutral-200 rounded w-16" />
          <div className="h-3 bg-neutral-200 rounded w-16" />
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="h-3 bg-neutral-200 rounded w-20" />
      </td>
    </tr>
  );
}

export function AdminConnectionsTable({
  connections,
  isLoading,
  error,
  onViewDetails,
  pagination,
  onPageChange,
}: AdminConnectionsTableProps) {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-600">{t('common.error_loading_data')}</p>
        <p className="text-xs text-neutral-500 mt-2">{error.message}</p>
      </div>
    );
  }

  if (!isLoading && (!connections || connections.length === 0)) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-neutral-600">{t('connections.no_connections_found')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {t('connections.table.connection', 'Connection')}
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {t('connections.table.agent')}
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {t('connections.table.ai_responds_to', 'AI Responds To')}
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {t('connections.table.created')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              connections.map((connection) => {
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
                    {/* Connection - merged: avatar + status dot + platform badge + name + handle + followers + verification */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar with status dot */}
                        <div className="relative shrink-0">
                          {connection.platformPictureUrl ? (
                            <img
                              src={connection.platformPictureUrl}
                              alt={connection.platformAccountName || ''}
                              className={`w-10 h-10 rounded-full ${!connection.isActive ? 'opacity-50' : ''}`}
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 text-sm font-medium ${!connection.isActive ? 'opacity-50' : ''}`}>
                              {(connection.platformAccountName || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                              connection.isActive ? 'bg-green-500' : 'bg-neutral-300'
                            }`}
                          />
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${platformConfig.bg} ${platformConfig.text}`}>
                              {platformConfig.label}
                            </span>
                            {connection.platform === 'whatsapp' &&
                             connection.codeVerificationStatus !== 'VERIFIED' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800">
                                {t('connections.details.pending_verification')}
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-neutral-900 mt-0.5 truncate">
                            {connection.platform === 'whatsapp' && connection.platformAccountName ? (
                              <PhoneNumber value={connection.platformAccountName} className="inline" />
                            ) : (
                              connection.platformAccountName || t('common.unknown')
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                            {connection.platformAccountHandle && (
                              <span className="truncate">@{connection.platformAccountHandle}</span>
                            )}
                            {connection.platformAccountHandle && connection.followerCount !== null && (
                              <span>·</span>
                            )}
                            {connection.followerCount !== null && (
                              <span>{connection.followerCount.toLocaleString()} {t('connections.table.followers')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Agent + Organization */}
                    <td className="px-5 py-4">
                      <div className="text-sm text-neutral-900">
                        {connection.agentName || t('common.unknown')}
                      </div>
                      {connection.organizationName && (
                        <div className="text-xs text-neutral-400 mt-0.5">
                          {connection.organizationName}
                        </div>
                      )}
                    </td>

                    {/* AI Responds To */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${connection.respondToMessages ? 'bg-green-500' : 'bg-neutral-300'}`} />
                          <span className={`text-xs ${connection.respondToMessages ? 'text-neutral-700' : 'text-neutral-400'}`}>
                            {t('connections.table.messages', 'Messages')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${connection.respondToComments ? 'bg-green-500' : 'bg-neutral-300'}`} />
                          <span className={`text-xs ${connection.respondToComments ? 'text-neutral-700' : 'text-neutral-400'}`}>
                            {t('connections.table.comments', 'Comments')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Created */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">
                        {format(new Date(connection.createdAt), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {format(new Date(connection.createdAt), 'h:mm a')}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && !isLoading && (
        <div className="px-5 py-3 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-sm text-neutral-500">
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

            <span className="text-sm text-neutral-500">
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
