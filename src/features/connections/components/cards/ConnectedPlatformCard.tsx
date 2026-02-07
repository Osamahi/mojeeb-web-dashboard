/**
 * Connected Platform Card Component
 * Displays a connected platform in horizontal row layout
 * Used in the "Connected Platforms" section
 */

import { MoreVertical, AlertCircle, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PlatformIcon } from '../PlatformIcon';
import { getPlatformById } from '../../constants/platforms';
import type { PlatformConnection } from '../../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/Button';

/**
 * Format follower count with K/M suffix (brief)
 */
function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format follower count with comma separators (full)
 */
function formatFollowerCountFull(count: number): string {
  return count.toLocaleString();
}

/**
 * Calculate days since connection
 */
function getDaysSinceConnection(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export interface ConnectedPlatformCardProps {
  connection: PlatformConnection;
  onManage?: (connection: PlatformConnection) => void;
  onDisconnect?: (connection: PlatformConnection) => void;
  onViewHealth?: (connection: PlatformConnection) => void;
  className?: string;
  /** Optional health status for warning indicator */
  hasWarning?: boolean;
}

export function ConnectedPlatformCard({
  connection,
  onManage,
  onDisconnect,
  onViewHealth,
  className,
  hasWarning = false,
}: ConnectedPlatformCardProps) {
  const { t } = useTranslation();
  const platform = getPlatformById(connection.platform);
  const displayName = connection.platformAccountName || connection.platformAccountHandle || platform?.name || t('connections.status_connected');

  // Extract metadata
  const followerCount = connection.platformMetadata?.follower_count as number | undefined;
  const parentPageName = connection.platformMetadata?.parent_page_name as string | undefined;
  const daysSinceConnection = getDaysSinceConnection(connection.createdAt);

  const handleCardClick = () => {
    onManage?.(connection);
  };

  const handleDisconnect = () => {
    onDisconnect?.(connection);
  };

  const handleViewHealth = () => {
    onViewHealth?.(connection);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative flex items-center gap-2.5 sm:gap-3 rounded-lg border border-neutral-200 bg-white p-2.5 sm:p-3 transition-all cursor-pointer hover:border-neutral-300 hover:shadow-sm',
        !connection.isActive && 'opacity-60',
        className
      )}
    >
      {/* Profile Picture or Platform Icon with Online Indicator */}
      <div className="flex-shrink-0 relative">
        {connection.platformPictureUrl ? (
          <img
            src={connection.platformPictureUrl}
            alt={displayName}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
            onError={(e) => {
              // Fallback to platform icon if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={connection.platformPictureUrl ? 'hidden' : ''}>
          <PlatformIcon
            platform={connection.platform}
            size="md"
            variant="brand"
            showBackground
          />
        </div>
        {/* Online/Connected Indicator - Colored dot at bottom right */}
        {connection.isActive && (
          <div className={cn(
            "absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white",
            connection.platform === 'whatsapp' && connection.codeVerificationStatus !== 'VERIFIED'
              ? "bg-yellow-500"
              : "bg-green-500"
          )} />
        )}
      </div>

      {/* Account Info - Main Content */}
      <div className="flex-1 min-w-0">
        {/* Account Name & Warning */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="text-sm font-semibold text-neutral-900 truncate">
            {displayName}
          </h3>
          {hasWarning && (
            <AlertCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
          )}
        </div>

        {/* Super Minimal Metadata Labels - Brief on mobile, full on desktop */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-neutral-500 flex-wrap">
          <span className="whitespace-nowrap">{t(`connections.platform_names.${connection.platform}`, platform?.name || 'Unknown')}</span>

          {followerCount !== undefined && followerCount > 0 && (
            <>
              <span>•</span>
              {/* Mobile: Brief format */}
              <span className="whitespace-nowrap sm:hidden">{formatFollowerCount(followerCount)}</span>
              {/* Desktop: Full format */}
              <span className="whitespace-nowrap hidden sm:inline">{formatFollowerCountFull(followerCount)} {t('connections.followers_label')}</span>
            </>
          )}

          <span>•</span>
          {/* Mobile: Brief format */}
          <span className="whitespace-nowrap sm:hidden">
            {daysSinceConnection === 0
              ? t('connections.today')
              : daysSinceConnection === 1
              ? t('connections.day_ago')
              : t('connections.days_ago', { days: daysSinceConnection })}
          </span>
          {/* Desktop: Full format */}
          <span className="whitespace-nowrap hidden sm:inline">
            {daysSinceConnection === 0
              ? t('connections.connected_today')
              : daysSinceConnection === 1
              ? t('connections.connected_day_ago')
              : t('connections.connected_days_ago', { days: daysSinceConnection })}
          </span>

          {connection.isActive && (
            <>
              <span>•</span>
              {connection.platform === 'whatsapp' && connection.codeVerificationStatus !== 'VERIFIED' ? (
                <span className="whitespace-nowrap text-yellow-600 font-medium">{t('connections.details.pending_verification')}</span>
              ) : (
                <span className="whitespace-nowrap text-green-600 font-medium">{t('connections.status_connected')}</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions Menu */}
      <div className="flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onViewHealth && (
              <DropdownMenuItem onClick={handleViewHealth}>
                {t('connections.health_check')}
              </DropdownMenuItem>
            )}
            {onDisconnect && (
              <DropdownMenuItem
                onClick={handleDisconnect}
                className="text-red-600 focus:text-red-600"
              >
                {t('connections.disconnect')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Inactive State Overlay */}
      {!connection.isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <span className="text-xs font-medium text-neutral-600 bg-white px-2.5 py-1 rounded-md border border-neutral-300">
            {t('connections.inactive')}
          </span>
        </div>
      )}
    </div>
  );
}
