/**
 * Exponential Backoff Retry Configuration
 * Implements smart retry logic with exponential delays for API requests
 */

import { logger } from './logger';
import type { CatchError } from './errors';
import { getErrorMessage, isAxiosError } from './errors';

export interface RetryConfig {
  maxAttempts: number;
  maxDelay: number;
  noRetryStatuses: number[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  maxDelay: 30000, // 30 seconds
  noRetryStatuses: [401, 403, 404, 422], // Don't retry auth errors or client errors
};

/**
 * Calculate exponential backoff delay
 * Formula: min(1000 * 2^attempt, maxDelay)
 *
 * @param attempt - Current retry attempt (0-indexed)
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Delay in milliseconds
 */
export function calculateExponentialDelay(attempt: number, maxDelay: number = 30000): number {
  const baseDelay = 1000; // 1 second
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  return Math.min(exponentialDelay, maxDelay);
}

/**
 * Determine if an error should trigger a retry
 *
 * @param error - The error object from the request
 * @param attemptNumber - Current attempt number (1-indexed)
 * @param config - Retry configuration
 * @returns True if should retry, false otherwise
 */
export function shouldRetry(
  error: CatchError,
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  // Don't retry if max attempts reached
  if (attemptNumber >= config.maxAttempts) {
    logger.warn('Max retry attempts reached', { attemptNumber, maxAttempts: config.maxAttempts });
    return false;
  }

  // Don't retry if status code indicates client error
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status && config.noRetryStatuses.includes(status)) {
    logger.info('Not retrying due to status code', { status, noRetryStatuses: config.noRetryStatuses });
    return false;
  }

  // Special handling for rate limiting (429)
  if (status === 429) {
    const retryAfter = isAxiosError(error) ? error.response?.headers?.['retry-after'] : undefined;
    if (retryAfter) {
      logger.warn('Rate limited - retry after header present', { retryAfter });
    }
    // Allow retry for rate limiting, but with longer delay
    return attemptNumber < 2; // Only retry once for 429
  }

  // Retry for network errors, 5xx errors, and timeouts
  const errorCode = isAxiosError(error) ? error.code : undefined;
  const shouldRetryRequest =
    !status || // Network error (no response)
    (status >= 500 && status < 600) || // Server error
    errorCode === 'ECONNABORTED' || // Timeout
    errorCode === 'ENOTFOUND' || // DNS error
    errorCode === 'ENETUNREACH'; // Network unreachable

  if (shouldRetryRequest) {
    logger.info('Retrying request', {
      attemptNumber,
      status,
      errorCode,
      delay: calculateExponentialDelay(attemptNumber - 1)
    });
  }

  return shouldRetryRequest;
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a request with exponential backoff
 *
 * @param requestFn - Function that returns a Promise for the request
 * @param config - Retry configuration
 * @returns Promise that resolves with the request result
 */
export async function retryWithBackoff<T>(
  requestFn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: CatchError;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      const shouldRetryRequest = shouldRetry(error, attempt + 1, config);

      if (!shouldRetryRequest) {
        throw error;
      }

      const delay = calculateExponentialDelay(attempt, config.maxDelay);

      logger.debug('Retrying after delay', {
        attempt: attempt + 1,
        delay,
        maxAttempts: config.maxAttempts
      });

      await sleep(delay);
    }
  }

  // If we get here, all retries failed
  logger.error('All retry attempts failed', lastError, { maxAttempts: config.maxAttempts });
  throw lastError;
}
