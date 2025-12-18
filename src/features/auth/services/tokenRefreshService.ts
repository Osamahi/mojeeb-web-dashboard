/**
 * Token Refresh Service - Proactive token refresh to prevent expiration
 *
 * This service automatically refreshes access tokens BEFORE they expire
 * to prevent 401 errors and improve user experience.
 *
 * Strategy:
 * - Access tokens expire in 15 minutes
 * - Refresh at 12 minutes (80% of lifetime) to provide buffer
 * - Only run when user is authenticated
 * - Stop on logout or error
 */

import { logger } from '@/lib/logger';
import { useAuthStore } from '../stores/authStore';
import { getRefreshToken } from '@/lib/tokenManager';
import { authService } from './authService';

// Refresh tokens at 12 minutes (before 15-minute expiry)
const REFRESH_INTERVAL_MS = 12 * 60 * 1000; // 12 minutes

class TokenRefreshService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

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
    });

    this.isRunning = true;

    // Set up interval to refresh tokens proactively
    this.intervalId = setInterval(async () => {
      await this.refreshIfAuthenticated();
    }, REFRESH_INTERVAL_MS);
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

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  /**
   * Check if service is currently running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Manually trigger token refresh (useful for testing)
   */
  async refreshNow(): Promise<void> {
    await this.refreshIfAuthenticated();
  }

  /**
   * Internal method to refresh tokens if user is authenticated
   * @private
   */
  private async refreshIfAuthenticated(): Promise<void> {
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      logger.debug('[TokenRefreshService] User not authenticated, skipping refresh');
      this.stop(); // Stop the service if user is not authenticated
      return;
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      logger.warn('[TokenRefreshService] No refresh token found, stopping service');
      this.stop();
      return;
    }

    try {
      logger.info('[TokenRefreshService] Proactively refreshing tokens');

      // Use the centralized refresh method that updates all systems
      const tokens = await authService.refreshAndUpdateSession(refreshToken);

      // Update Zustand store with new tokens
      useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);

      logger.info('[TokenRefreshService] Tokens refreshed successfully', {
        nextRefresh: `${REFRESH_INTERVAL_MS / 60000} minutes`,
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
