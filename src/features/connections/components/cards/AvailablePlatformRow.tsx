/**
 * Available Platform Row Component
 * Displays an available integration platform as a list row
 * Used in the "Available Integrations" section
 */

import { useState } from 'react';
import { Plus, Pencil, Rocket, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { PlatformIcon } from '../PlatformIcon';
import { WhatsAppUpgradeModal } from '../dialogs/WhatsAppUpgradeModal';
import { getEffectivePlatformStatus } from '../../constants/platforms';
import type { PlatformMetadata } from '../../constants/platforms';
import type { PlatformType } from '../../types';
import { useHasWhatsAppAccess } from '../../hooks/useHasWhatsAppAccess';

export interface AvailablePlatformRowProps {
  platform: PlatformMetadata;
  onConnect: (platformId: PlatformType) => void;
  onCustomize?: (platformId: PlatformType) => void;
  userRole?: number;
  className?: string;
}

export function AvailablePlatformRow({
  platform,
  onConnect,
  onCustomize,
  userRole,
  className,
}: AvailablePlatformRowProps) {
  const { t } = useTranslation();
  const hasWhatsAppAccess = useHasWhatsAppAccess();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Get effective status based on user role (will show 'coming_soon' for non-SuperAdmins if requiresSuperAdmin is true)
  const effectiveStatus = getEffectivePlatformStatus(platform, userRole);
  const isComingSoon = effectiveStatus === 'coming_soon';
  const showsWidget = platform.showsWidget;
  const requiresUpgrade = platform.id === 'whatsapp' && !hasWhatsAppAccess;

  const handleConnect = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (requiresUpgrade) {
      setIsUpgradeModalOpen(true);
      return;
    }
    onConnect(platform.id);
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2.5 sm:gap-3 rounded-lg border p-2.5 sm:p-3 transition-all',
        isComingSoon
          ? 'border-neutral-200 bg-neutral-50/50 opacity-60 cursor-not-allowed'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm',
        !showsWidget && !isComingSoon && 'cursor-pointer',
        className
      )}
      onClick={() => !isComingSoon && !showsWidget && handleConnect()}
    >
      {/* Platform Icon */}
      <div className="flex-shrink-0">
        <PlatformIcon
          platform={platform.id}
          size="md"
          variant="brand"
          showBackground
          className={cn(isComingSoon && 'grayscale')}
        />
      </div>

      {/* Platform Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3
            className={cn(
              'text-sm font-semibold truncate',
              isComingSoon ? 'text-neutral-500' : 'text-neutral-900'
            )}
          >
            {t(`connections.platform_${platform.id}_name`)}
          </h3>
          {requiresUpgrade && (
            <Tooltip>
              <TooltipTrigger>
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-medium leading-none">
                  <Lock className="w-2.5 h-2.5" />
                  {t('connections.paid_badge')}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {t('connections.whatsapp_upgrade_modal.lock_tooltip')}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Descriptive description - up to 2 lines */}
        <p
          className={cn(
            'text-[11px] line-clamp-2',
            isComingSoon ? 'text-neutral-400' : 'text-neutral-500'
          )}
        >
          {t(`connections.platform_${platform.id}_desc`)}
        </p>
      </div>

      {/* Coming Soon Badge or Action Buttons */}
      {isComingSoon ? (
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
            Coming Soon
          </span>
        </div>
      ) : showsWidget ? (
        // Widget platform: Show both Customize and Connect buttons
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onCustomize?.(platform.id);
            }}
            variant="ghost"
            className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs sm:text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
            size="sm"
          >
            <Pencil className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('connections.edit_button')}</span>
          </Button>
          <Button
            onClick={handleConnect}
            className="h-7 sm:h-8 px-2.5 sm:px-3 bg-brand-mojeeb hover:bg-brand-mojeeb-hover text-white text-xs sm:text-sm"
            size="sm"
          >
            <span className="hidden sm:inline">{t('connections.connect_button')}</span>
            <Plus className="w-3.5 h-3.5 sm:ml-1" />
          </Button>
        </div>
      ) : requiresUpgrade ? (
        // Gated platform: Upgrade pill (same dimensions as Connect, black instead of green)
        <div className="flex-shrink-0">
          <Button
            onClick={handleConnect}
            className="h-7 sm:h-8 px-2.5 sm:px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm"
            size="sm"
          >
            <span className="hidden sm:inline">{t('connections.upgrade_plan_cta')}</span>
            <Rocket className="w-3.5 h-3.5 sm:ml-1" />
          </Button>
        </div>
      ) : (
        // Other platforms: Show only Connect button
        <div className="flex-shrink-0">
          <Button
            onClick={handleConnect}
            className="h-7 sm:h-8 px-2.5 sm:px-3 bg-brand-mojeeb hover:bg-brand-mojeeb-hover text-white text-xs sm:text-sm"
            size="sm"
          >
            <span className="hidden sm:inline">{t('connections.connect_button')}</span>
            <Plus className="w-3.5 h-3.5 sm:ml-1" />
          </Button>
        </div>
      )}

      {requiresUpgrade && (
        <WhatsAppUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </div>
  );
}
