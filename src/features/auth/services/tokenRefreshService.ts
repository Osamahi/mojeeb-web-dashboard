/**
 * Token Refresh Service - Proactive token refresh to prevent expiration
 *
 * This service automatically refreshes access tokens BEFORE they expire
 * to prevent 401 errors and improve user experience.
 *
 * Strategy (Updated to handle browser timer throttling):
 * - Access tokens expire in 15 minutes
 * - Refresh at 12 minutes (80% of lifetime) to provide buffer
 * - Uses visibilitychange event to detect page activation (immune to browser throttling)
 * - Tracks last refresh timestamp to prevent over-refreshing
 * - Fallback setInterval for active sessions (in case visibility events don't fire)
 * - Only run when user is authenticated
 * - Stop on logout or error
 *
 * Problem Solved:
 * Browser tab throttling causes setInterval to be throttled to ~1/minute when page
 * is backgrounded/idle. This breaks proactive token refresh. The new approach uses
 * visibilitychange events which always fire when page becomes visible, plus tracks
 * the last refresh time to intelligently decide when to refresh.
 */

import { logger } from '@/lib/logger';
import { useAuthStore } from '../stores/authStore';
import { getAccessToken, getRefreshToken } from '@/lib/tokenManager';
import { authService } from './authService';
import { isTokenExpired, getTokenRemainingTime } from '../utils/tokenUtils';

// Refresh tokens at 12 minutes (before 15-minute expiry)
const REFRESH_INTERVAL_MS = 12 * 60 * 1000; // 12 minutes
// Minimum time between refreshes (prevent over-refreshing)
const MIN_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

class TokenRefreshService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastRefreshTimestamp: number = 0;
  private visibilityChangeHandler: (() => void) | null = null;

  /**
   * Start the proactive token refresh service
   * Should be called after successful authentication
   */
  start(): void {
    if (this.isRunning) {
      logger.debug('[TokenRefreshService] Already running, skipping start');
      return;
    }

    logger.info('[TokenRefreshService] Starting proactive token refresh', {
      refreshInterval: `${REFRESH_INTERVAL_MS / 60000} minutes`,
      minRefreshInterval: `${MIN_REFRESH_INTERVAL_MS / 60000} minutes`,
      strategy: 'visibilitychange + fallback interval',
    });

    this.isRunning = true;
    this.lastRefreshTimestamp = Date.now(); // Initialize with current time

    // 1. Set up visibilitychange listener (primary mechanism - immune to throttling)
    this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    // 2. Set up fallback interval for active sessions (in case visibility events don't fire)
    // This interval will get throttled when page is backgrounded, but that's OK
    // because the visibilitychange handler will catch the resume case
    this.intervalId = setInterval(async () => {
      await this.refreshIfNeeded();
    }, REFRESH_INTERVAL_MS);

    logger.debug('[TokenRefreshService] Visibility listener and fallback interval registered');
  }

  /**
   * Handle page visibility changes
   * Fires when tab becomes visible (user switches back to tab)
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      logger.debug('[TokenRefreshService] Page became visible, checking token status');

      // Don't await - run in background to avoid blocking the event handler
      this.refreshIfNeeded().catch((error) => {
        logger.error('[TokenRefreshService] Error during visibility-triggered refresh', error);
      });
    }
  }

  /**
   * Stop the proactive token refresh service
   * Should be called on logout
   */
  stop(): void {
    if (!this.isRunning) {
      logger.debug('[TokenRefreshService] Not running, skipping stop');
      return;
    }

    logger.info('[TokenRefreshService] Stopping proactive token refresh');

    // Remove visibility change listener
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    // Clear fallback interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.lastRefreshTimestamp = 0;
  }

  /**
   * Check if service is currently running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Manually trigger token refresh (useful for testing)
   * Forces a refresh regardless of timestamp checks
   */
  async refreshNow(): Promise<void> {
    await this.performRefresh();
  }

  /**
   * Check if token needs refresh based on:
   * 1. Time since last refresh
   * 2. Token expiration status
   * 3. Authentication state
   *
   * @private
   */
  private async refreshIfNeeded(): Promise<void> {
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      logger.debug('[TokenRefreshService] User not authenticated, skipping refresh');
      this.stop(); // Stop the service if user is not authenticated
      return;
    }

    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      logger.warn('[TokenRefreshService] No refresh token found, stopping service');
      this.stop();
      return;
    }

    // Calculate time since last refresh
    const timeSinceLastRefresh = Date.now() - this.lastRefreshTimestamp;

    // Check if token is expired or expiring soon
    const tokenExpired = accessToken ? isTokenExpired(accessToken) : true;
    const tokenRemainingTime = accessToken ? getTokenRemainingTime(accessToken) : 0;

    // Decide if refresh is needed
    const shouldRefresh =
      tokenExpired || // Token is already expired
      timeSinceLastRefresh >= MIN_REFRESH_INTERVAL_MS; // Enough time has passed

    if (shouldRefresh) {
      logger.info('[TokenRefreshService] Refresh needed', {
        timeSinceLastRefresh: `${Math.floor(timeSinceLastRefresh / 1000)}s`,
        tokenExpired,
        tokenRemainingTime: accessToken ? `${Math.floor(tokenRemainingTime / 1000)}s` : 'N/A',
      });

      await this.performRefresh();
    } else {
      logger.debug('[TokenRefreshService] Refresh not needed yet', {
        timeSinceLastRefresh: `${Math.floor(timeSinceLastRefresh / 1000)}s`,
        minInterval: `${MIN_REFRESH_INTERVAL_MS / 1000}s`,
        tokenRemainingTime: `${Math.floor(tokenRemainingTime / 1000)}s`,
      });
    }
  }

  /**
   * Perform the actual token refresh operation
   * Updates last refresh timestamp on success
   *
   * @private
   */
  private async performRefresh(): Promise<void> {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      logger.warn('[TokenRefreshService] No refresh token found');
      this.stop();
      return;
    }

    try {
      logger.info('[TokenRefreshService] Performing token refresh');

      // Use the centralized refresh method that updates all systems
      const tokens = await authService.refreshAndUpdateSession(refreshToken);

      // Update Zustand store with new tokens
      useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);

      // Update last refresh timestamp
      this.lastRefreshTimestamp = Date.now();

      logger.info('[TokenRefreshService] Tokens refreshed successfully', {
        nextScheduledRefresh: `${REFRESH_INTERVAL_MS / 60000} minutes`,
      });
    } catch (error) {
      logger.error('[TokenRefreshService] Token refresh failed', error instanceof Error ? error : new Error(String(error)));

      // Stop the service on error and let API interceptor handle re-authentication
      this.stop();

      // Don't automatically logout here - let the API interceptor handle it
      // This prevents duplicate logout calls
    }
  }
}

// Export singleton instance
export const tokenRefreshService = new TokenRefreshService();
