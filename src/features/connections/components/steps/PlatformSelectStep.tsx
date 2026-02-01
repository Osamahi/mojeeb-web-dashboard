/**
 * Platform Selection Step
 * Allows user to choose which platform to connect (Facebook or Instagram)
 */

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { OAuthIntegrationType, PlatformConnection, PlatformType } from '../../types';
import { PlatformIcon } from '../PlatformIcon';

type PlatformSelectStepProps = {
  onSelect: (platform: OAuthIntegrationType) => void;
  existingConnections: PlatformConnection[];
};

type PlatformOption = {
  id: OAuthIntegrationType;
  nameKey: string;
  descKey: string;
  comingSoon?: boolean;
};

export function PlatformSelectStep({ onSelect, existingConnections }: PlatformSelectStepProps) {
  const { t } = useTranslation();

  const PLATFORM_OPTIONS: PlatformOption[] = [
    {
      id: 'facebook',
      nameKey: 'connections.facebook',
      descKey: 'connections.facebook_desc',
    },
    {
      id: 'instagram',
      nameKey: 'connections.instagram',
      descKey: 'connections.instagram_desc',
    },
  ];

  // Count connections for each platform
  const getConnectionCount = (platform: OAuthIntegrationType) =>
    existingConnections.filter(c => c.platform === platform && c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-semibold text-neutral-900">{t('connections.choose_platform')}</h3>
        <p className="mt-1 text-sm text-neutral-600">{t('connections.select_platform_desc')}</p>
      </div>

      <div className="grid gap-4">
        {PLATFORM_OPTIONS.map(platform => {
          const connectionCount = getConnectionCount(platform.id);
          const isComingSoon = platform.comingSoon;
          const isDisabled = isComingSoon;

          return (
            <button
              key={platform.id}
              onClick={() => {
                if (!isDisabled) {
                  onSelect(platform.id);
                }
              }}
              disabled={isDisabled}
              className={cn(
                'group relative flex items-start gap-4 rounded-lg border p-4 min-h-[44px] text-left transition-all',
                isComingSoon
                  ? 'cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2'
              )}
            >
              {/* Platform icon */}
              <div className={cn('flex-shrink-0', isComingSoon && 'grayscale')}>
                <PlatformIcon
                  platform={platform.id as PlatformType}
                  size="xl"
                  variant="brand"
                  showBackground={true}
                />
              </div>

              {/* Platform info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={cn('font-medium', isComingSoon ? 'text-neutral-500' : 'text-neutral-900')}>
                    {t(platform.nameKey)}
                  </h4>
                  {isComingSoon && (
                    <span className="inline-flex items-center rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      {t('connections.coming_soon')}
                    </span>
                  )}
                  {connectionCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {t('connections.connected_count', { count: connectionCount })}
                    </span>
                  )}
                </div>
                <p className={cn('mt-1 text-sm', isComingSoon ? 'text-neutral-400' : 'text-neutral-600')}>
                  {t(platform.descKey)}
                </p>
              </div>

              {/* Arrow indicator */}
              {!isDisabled && (
                <div className="flex-shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg bg-neutral-50 p-3">
        <p className="text-xs text-neutral-600">
          <strong>{t('connections.note')}:</strong> {t('connections.platform_note')}
        </p>
      </div>
    </div>
  );
}
