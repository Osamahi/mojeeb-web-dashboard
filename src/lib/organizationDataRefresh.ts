/**
 * Organization Data Refresh Utility
 *
 * Centralizes invalidation of all organization-scoped queries
 * Used when switching organizations or when org data needs to be refreshed
 */

import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';

/**
 * Invalidates all queries that depend on organization context
 * This forces a refetch of fresh data for the new organization
 */
export async function refreshOrganizationData(queryClient: QueryClient): Promise<void> {
  logger.info('[refreshOrganizationData] Invalidating all organization-scoped queries');

  try {
    // Invalidate all org-dependent queries in parallel
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['agents'] }),
      queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      queryClient.invalidateQueries({ queryKey: ['team-members'] }),
      queryClient.invalidateQueries({ queryKey: ['connections'] }),
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] }),
      queryClient.invalidateQueries({ queryKey: ['leads'] }),
      queryClient.invalidateQueries({ queryKey: ['analytics'] }),
      queryClient.invalidateQueries({ queryKey: ['widget'] }),
      queryClient.invalidateQueries({ queryKey: ['insights'] }),
      queryClient.invalidateQueries({ queryKey: ['subscription'] }),
      queryClient.invalidateQueries({ queryKey: ['organization'] }),
    ]);

    logger.info('[refreshOrganizationData] ✅ All queries invalidated successfully');
  } catch (error) {
    logger.error('[refreshOrganizationData] Error invalidating queries', error as Error);
    throw error;
  }
}
