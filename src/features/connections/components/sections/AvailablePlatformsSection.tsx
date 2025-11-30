/**
 * Available Platforms Section
 * Displays list of available integrations (both available and coming soon)
 */

import { AvailablePlatformRow } from '../cards/AvailablePlatformRow';
import { PLATFORMS } from '../../constants/platforms';
import type { PlatformType, PlatformConnection } from '../../types';

export interface AvailablePlatformsSectionProps {
  connections: PlatformConnection[];
  onConnect: (platformId: PlatformType) => void;
  isLoading?: boolean;
}

export function AvailablePlatformsSection({
  connections,
  onConnect,
  isLoading = false,
}: AvailablePlatformsSectionProps) {
  // Get IDs of already connected platforms
  const connectedPlatformIds = new Set(
    connections.filter((c) => c.isActive).map((c) => c.platform)
  );

  // Filter out connected platforms (users can have multiple of same platform)
  // But we still show them in available if they might want to add more accounts
  const availablePlatforms = PLATFORMS.filter((platform) => {
    // Show all platforms - users can connect multiple accounts
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">
          Add Connections
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-neutral-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {/* All Platforms List - No separation */}
      {!isLoading && (
        <div className="space-y-3">
          {availablePlatforms.map((platform) => (
            <AvailablePlatformRow
              key={platform.id}
              platform={platform}
              onConnect={onConnect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
