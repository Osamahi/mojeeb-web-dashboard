/**
 * Connections List Component
 * Displays a grid of platform connections with loading and empty states
 */

import { useMemo } from 'react';
import { Link2Off } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PlatformConnectionCard } from './PlatformConnectionCard';
import type { PlatformConnection, PlatformType } from '../types';

export interface ConnectionsListProps {
  connections: PlatformConnection[];
  isLoading?: boolean;
  showHealthStatus?: boolean;
  filterPlatform?: PlatformType | 'all';
}

export function ConnectionsList({
  connections,
  isLoading = false,
  showHealthStatus = false,
  filterPlatform = 'all',
}: ConnectionsListProps) {
  // Filter and sort connections - memoized for performance
  const sortedConnections = useMemo(() => {
    // Filter connections by platform if specified
    const filteredConnections =
      filterPlatform === 'all'
        ? connections
        : connections.filter(conn => conn.platform === filterPlatform);

    // Sort: active connections first, then by creation date
    return [...filteredConnections].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return b.isActive ? 1 : -1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [connections, filterPlatform]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <ConnectionCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (sortedConnections.length === 0) {
    return (
      <EmptyState
        icon={<Link2Off className="w-12 h-12 text-neutral-400" />}
        title="No connections found"
        description={
          filterPlatform === 'all'
            ? 'This agent is not connected to any platforms yet. Connect a platform to start receiving messages.'
            : `No ${filterPlatform} connections found for this agent.`
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {sortedConnections.map(connection => (
        <PlatformConnectionCard
          key={connection.id}
          connection={connection}
          showHealthStatus={showHealthStatus}
        />
      ))}
    </div>
  );
}

function ConnectionCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Avatar skeleton */}
          <Skeleton className="w-12 h-12 rounded-lg" />

          <div className="space-y-2">
            {/* Title skeleton */}
            <Skeleton className="w-48 h-5" />
            {/* Handle skeleton */}
            <Skeleton className="w-32 h-4" />
            {/* Badges skeleton */}
            <div className="flex gap-2">
              <Skeleton className="w-20 h-5 rounded-full" />
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
            {/* Date skeleton */}
            <Skeleton className="w-28 h-3" />
          </div>
        </div>

        {/* Button skeleton */}
        <Skeleton className="w-24 h-9 rounded-md" />
      </div>
    </div>
  );
}
