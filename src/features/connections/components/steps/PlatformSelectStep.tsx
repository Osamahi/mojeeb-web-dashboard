/**
 * Platform Selection Step
 * Allows user to choose which platform to connect (Facebook or Instagram)
 */

import { cn } from '@/lib/utils';
import type { OAuthIntegrationType, PlatformConnection, PlatformType } from '../../types';
import { PlatformIcon } from '../PlatformIcon';

type PlatformSelectStepProps = {
  onSelect: (platform: OAuthIntegrationType) => void;
  existingConnections: PlatformConnection[];
};

type PlatformOption = {
  id: OAuthIntegrationType | 'whatsapp';
  name: string;
  description: string;
  comingSoon?: boolean;
};

const PLATFORM_OPTIONS: PlatformOption[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Connect your Facebook Business Page to receive and respond to messages',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect your Instagram Business Account to manage DMs and comments',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Connect your WhatsApp Business account to automate customer conversations',
    comingSoon: true,
  },
];

export function PlatformSelectStep({ onSelect, existingConnections }: PlatformSelectStepProps) {
  // Count connections for each platform
  const getConnectionCount = (platform: OAuthIntegrationType | 'whatsapp') =>
    existingConnections.filter(c => c.platform === platform && c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-neutral-900">Choose a Platform</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Select the platform you want to connect to your agent
        </p>
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
                // Type guard to ensure only valid OAuth platforms are passed
                if (!isDisabled && platform.id !== 'whatsapp') {
                  onSelect(platform.id);
                }
              }}
              disabled={isDisabled}
              className={cn(
                'group relative flex items-start gap-4 rounded-lg border p-4 text-left transition-all',
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
                    {platform.name}
                  </h4>
                  {isComingSoon && (
                    <span className="inline-flex items-center rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      Coming Soon
                    </span>
                  )}
                  {connectionCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {connectionCount} connected
                    </span>
                  )}
                </div>
                <p className={cn('mt-1 text-sm', isComingSoon ? 'text-neutral-400' : 'text-neutral-600')}>
                  {platform.description}
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
          <strong>Note:</strong> You can connect multiple pages/accounts for the same platform. You will be
          redirected to authorize access. Make sure you have admin permissions for the page or account you want to
          connect.
        </p>
      </div>
    </div>
  );
}
