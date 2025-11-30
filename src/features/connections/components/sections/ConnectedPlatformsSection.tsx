/**
 * Connected Platforms Section
 * Displays grid of connected platforms
 */

import { Plug } from 'lucide-react';
import { ConnectedPlatformCard } from '../cards/ConnectedPlatformCard';
import type { PlatformConnection } from '../../types';

export interface ConnectedPlatformsSectionProps {
  connections: PlatformConnection[];
  isLoading?: boolean;
  onManage?: (connection: PlatformConnection) => void;
  onDisconnect?: (connection: PlatformConnection) => void;
  onViewHealth?: (connection: PlatformConnection) => void;
}

export function ConnectedPlatformsSection({
  connections,
  isLoading = false,
  onManage,
  onDisconnect,
  onViewHealth,
}: ConnectedPlatformsSectionProps) {
  // Show empty state if no connections
  if (!isLoading && connections.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Connected Platforms
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
            <Plug className="w-6 h-6 text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-900 mb-1">
            No connections yet
          </p>
          <p className="text-sm text-neutral-600 text-center max-w-sm">
            Connect a platform below to start managing conversations with your customers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">
          Connected Platforms
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

      {/* List of Connected Platforms */}
      {!isLoading && (
        <div className="space-y-3">
          {connections.map((connection) => (
            <ConnectedPlatformCard
              key={connection.id}
              connection={connection}
              onManage={onManage}
              onDisconnect={onDisconnect}
              onViewHealth={onViewHealth}
            />
          ))}
        </div>
      )}
    </div>
  );
}
