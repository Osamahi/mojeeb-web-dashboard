/**
 * Connected Platform Card Component
 * Displays a connected platform in horizontal row layout
 * Used in the "Connected Platforms" section
 */

import { MoreVertical, HelpCircle, MessageSquare, MessageCircle, Unplug, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
import { Switch } from '@/components/ui/Switch';
import { PhoneNumber } from '@/components/ui/PhoneNumber';

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
  onReconnect?: (connection: PlatformConnection) => void;
  onToggleAIResponse?: (connection: PlatformConnection, enabled: boolean) => void;
  onToggleSetting?: (connection: PlatformConnection, setting: 'respond_to_messages' | 'respond_to_comments', enabled: boolean) => void;
  className?: string;
}

export function ConnectedPlatformCard({
  connection,
  onManage,
  onDisconnect,
  onToggleAIResponse,
  onReconnect,
  onToggleSetting,
  className,
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

  const handleOpenSupport = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (window.MojeebWidget) {
      window.MojeebWidget.open({
        message: 'I need help with WhatsApp number verification.'
      });
    } else {
      console.warn('[ConnectedPlatformCard] Mojeeb Widget is not loaded yet.');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative flex items-center gap-2.5 sm:gap-3 rounded-lg border border-neutral-200 bg-white p-2.5 sm:p-3 transition-all cursor-pointer hover:border-neutral-300 hover:shadow-sm',
        className
      )}
    >
      {/* Profile Picture or Platform Icon with Online Indicator */}
      <div className={cn("flex-shrink-0 relative", !connection.isActive && 'opacity-50')}>
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
            "absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white",
            connection.platform === 'whatsapp' && connection.codeVerificationStatus !== 'VERIFIED'
              ? "bg-yellow-500"
              : "bg-green-500"
          )} />
        )}
      </div>

      {/* Account Info - Main Content */}
      <div className={cn("flex-1 min-w-0", !connection.isActive && 'opacity-50')}>
        {/* Account Name & Warning */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="text-sm font-semibold text-neutral-900 truncate">
            {connection.platform === 'whatsapp' ? (
              <PhoneNumber value={displayName} className="inline" />
            ) : (
              displayName
            )}
          </h3>
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

          {connection.isActive ? (
            <>
              {connection.platform === 'whatsapp' && connection.codeVerificationStatus !== 'VERIFIED' && (
                <>
                  <span>•</span>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleOpenSupport}
                        className="whitespace-nowrap text-yellow-600 font-medium inline-flex items-center gap-1 cursor-pointer hover:text-yellow-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 rounded px-1 -mx-1"
                        aria-label={t('connections.details.contact_support')}
                      >
                        {t('connections.details.pending_verification')}
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      {t('connections.details.verification_help_tooltip')}
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </>
          ) : (
            <>
              <span>•</span>
              <span className="whitespace-nowrap text-red-500 font-medium">{t('connections.status_disconnected')}</span>
            </>
          )}

          {connection.isActive && (
            <>
              <span>•</span>
              <span className={`whitespace-nowrap font-medium ${connection.respondToMessages ? 'text-green-600' : 'text-neutral-400'}`}>
                {connection.respondToMessages ? t('connections.messages_on', 'Messages On') : t('connections.messages_off', 'Messages Off')}
              </span>
              {connection.platform !== 'whatsapp' && (
                <>
                  <span>•</span>
                  <span className={`whitespace-nowrap font-medium ${connection.respondToComments ? 'text-green-600' : 'text-neutral-400'}`}>
                    {connection.respondToComments ? t('connections.comments_on', 'Comments On') : t('connections.comments_off', 'Comments Off')}
                  </span>
                </>
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
          <DropdownMenuContent align="end" className="min-w-[200px]">
            {onToggleSetting && connection.isActive && (
              <>
                <div
                  className="flex items-center justify-between px-2 py-1.5"
                  onClick={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm">{t('connections.details.messages', 'Messages')}</span>
                  </div>
                  <Switch
                    size="sm"
                    checked={connection.respondToMessages}
                    onChange={(checked) => onToggleSetting(connection, 'respond_to_messages', checked)}
                  />
                </div>
                {connection.platform !== 'whatsapp' && (
                  <div
                    className="flex items-center justify-between px-2 py-1.5"
                    onClick={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-neutral-500" />
                      <span className="text-sm">{t('connections.details.comments', 'Comments')}</span>
                    </div>
                    <Switch
                      size="sm"
                      checked={connection.respondToComments}
                      onChange={(checked) => onToggleSetting(connection, 'respond_to_comments', checked)}
                    />
                  </div>
                )}
                <div className="my-1 border-t border-neutral-200" />
              </>
            )}
            {connection.isActive && onDisconnect && (
              <DropdownMenuItem onClick={handleDisconnect}>
                <Unplug className="h-4 w-4 me-2" />
                {t('connections.disconnect')}
              </DropdownMenuItem>
            )}
            {!connection.isActive && onReconnect && (
              <DropdownMenuItem onClick={() => onReconnect(connection)}>
                <RotateCw className="h-4 w-4 me-2" />
                {t('connections.reconnect', 'Reconnect')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </div>
  );
}
