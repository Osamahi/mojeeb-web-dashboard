/**
 * React Query Retry Configuration Utilities
 * Reusable retry logic for document job queries
 */

import { isAxiosError } from '@/lib/errors';

/**
 * Maximum number of retry attempts for failed queries
 */
const MAX_RETRY_COUNT = 2;

/**
 * Create retry configuration for document job queries
 * @param excludeStatuses - HTTP status codes that should not trigger retries (default: [401, 403])
 * @returns Retry configuration object for React Query
 */
export const createDocumentJobRetryConfig = (excludeStatuses: number[] = [401, 403]) => ({
  retry: (failureCount: number, error: unknown): boolean => {
    // Don't retry on specific HTTP status codes (auth errors, etc.)
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status && excludeStatuses.includes(status)) {
        return false;
      }
    }

    // Retry up to MAX_RETRY_COUNT times for other errors
    return failureCount < MAX_RETRY_COUNT;
  },
});
