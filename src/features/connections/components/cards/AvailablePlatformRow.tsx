/**
 * Available Platform Row Component
 * Displays an available integration platform as a list row
 * Used in the "Available Integrations" section
 */

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlatformIcon } from '../PlatformIcon';
import type { PlatformMetadata } from '../../constants/platforms';
import type { PlatformType } from '../../types';

export interface AvailablePlatformRowProps {
  platform: PlatformMetadata;
  onConnect: (platformId: PlatformType) => void;
  className?: string;
}

export function AvailablePlatformRow({ platform, onConnect, className }: AvailablePlatformRowProps) {
  const isComingSoon = platform.status === 'coming_soon';

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2.5 sm:gap-3 rounded-lg border p-2.5 sm:p-3 transition-all',
        isComingSoon
          ? 'border-neutral-200 bg-neutral-50/50 opacity-60 cursor-not-allowed'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm cursor-pointer',
        className
      )}
      onClick={() => !isComingSoon && onConnect(platform.id)}
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
            {platform.name}
          </h3>
        </div>

        {/* Descriptive description - up to 2 lines */}
        <p
          className={cn(
            'text-[11px] line-clamp-2',
            isComingSoon ? 'text-neutral-400' : 'text-neutral-500'
          )}
        >
          {platform.description}
        </p>
      </div>

      {/* Coming Soon Badge or Connect Button */}
      {isComingSoon ? (
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
            Coming Soon
          </span>
        </div>
      ) : (
        <div className="flex-shrink-0">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onConnect(platform.id);
            }}
            className="h-7 sm:h-8 px-2.5 sm:px-3 bg-[#00D084] hover:bg-[#00BA75] text-white text-xs sm:text-sm"
            size="sm"
          >
            <span className="hidden sm:inline">Connect</span>
            <Plus className="w-3.5 h-3.5 sm:ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
