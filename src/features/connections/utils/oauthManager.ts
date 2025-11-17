/**
 * OAuth State Manager
 * Handles OAuth flow state, popup management, and security validation
 */

import { logger } from '@/lib/logger';
import { OAUTH_CONFIG } from '../constants';

const { STORAGE_KEYS, POPUP_WIDTH, POPUP_HEIGHT, TIMEOUT_MS } = OAUTH_CONFIG;

/**
 * Generate a cryptographically secure random string for CSRF protection
 */
export function generateOAuthState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store OAuth state parameters in sessionStorage
 */
export function storeOAuthState(state: string, platform: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.STATE, state);
    sessionStorage.setItem(STORAGE_KEYS.PLATFORM, platform);
    logger.debug('OAuth state stored', { platform });
  } catch (error) {
    logger.error('Failed to store OAuth state', { error });
    throw new Error('Unable to store OAuth state. Please enable sessionStorage.');
  }
}

/**
 * Validate that the received state matches the stored state
 */
export function validateOAuthState(receivedState: string): boolean {
  try {
    const storedState = sessionStorage.getItem(STORAGE_KEYS.STATE);
    if (!storedState) {
      logger.warn('No stored OAuth state found');
      return false;
    }

    const isValid = storedState === receivedState;
    if (!isValid) {
      logger.warn('OAuth state mismatch - possible CSRF attempt', {
        received: receivedState.substring(0, 10) + '...',
        stored: storedState.substring(0, 10) + '...',
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Error validating OAuth state', { error });
    return false;
  }
}

/**
 * Store temporary connection ID after OAuth callback
 * Returns true if storage succeeded, false otherwise
 */
export function storeTempConnectionId(tempConnectionId: string): boolean {
  try {
    sessionStorage.setItem(STORAGE_KEYS.TEMP_CONNECTION_ID, tempConnectionId);
    logger.debug('Temp connection ID stored', { tempConnectionId });
    return true;
  } catch (error) {
    logger.error('Failed to store temp connection ID', { error });
    return false;
  }
}

/**
 * Get stored temporary connection ID
 */
export function getTempConnectionId(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.TEMP_CONNECTION_ID);
}

/**
 * Get stored platform type
 */
export function getStoredPlatform(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.PLATFORM);
}

/**
 * Clean up all OAuth-related storage
 */
export function cleanupOAuthStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.STATE);
    sessionStorage.removeItem(STORAGE_KEYS.TEMP_CONNECTION_ID);
    sessionStorage.removeItem(STORAGE_KEYS.PLATFORM);
    logger.debug('OAuth storage cleaned up');
  } catch (error) {
    logger.error('Failed to cleanup OAuth storage', { error });
  }
}

/**
 * Calculate popup window position (center of screen)
 */
function getPopupPosition(): { left: number; top: number } {
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;
  return { left, top };
}

/**
 * Open OAuth authorization in a popup window
 * Returns a promise that resolves when the popup is closed or times out
 */
export function openOAuthPopup(authUrl: string): Promise<{ tempConnectionId: string }> {
  return new Promise((resolve, reject) => {
    const { left, top } = getPopupPosition();

    const popupFeatures = [
      `width=${POPUP_WIDTH}`,
      `height=${POPUP_HEIGHT}`,
      `left=${left}`,
      `top=${top}`,
      'scrollbars=yes',
      'resizable=yes',
      'status=yes',
      'toolbar=no',
      'menubar=no',
      'location=yes',
    ].join(',');

    const popup = window.open(authUrl, 'oauth_popup', popupFeatures);

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      logger.warn('Popup was blocked by browser');
      reject(new Error('POPUP_BLOCKED'));
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let pollInterval: ReturnType<typeof setInterval>;

    // Cleanup function
    const cleanup = () => {
      clearTimeout(timeoutId);
      clearInterval(pollInterval);
      window.removeEventListener('message', handleMessage);
    };

    // Handle postMessage from callback page
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        logger.warn('Received message from unknown origin', { origin: event.origin });
        return;
      }

      // Validate message structure for security
      if (
        typeof event.data !== 'object' ||
        event.data === null ||
        event.data.type !== 'OAUTH_CALLBACK'
      ) {
        return;
      }

      const { tempConnectionId, error } = event.data;

      // Validate error is a string if present
      if (error !== undefined && typeof error !== 'string') {
        logger.warn('Invalid error type in OAuth callback', { errorType: typeof error });
        return;
      }

      // Validate tempConnectionId is a string if present
      if (tempConnectionId !== undefined && typeof tempConnectionId !== 'string') {
        logger.warn('Invalid tempConnectionId type in OAuth callback', {
          type: typeof tempConnectionId,
        });
        return;
      }

      if (error) {
        logger.error('OAuth callback error', { error });
        cleanup();
        popup.close();
        reject(new Error(error));
        return;
      }

      if (tempConnectionId) {
        logger.info('OAuth callback successful', { tempConnectionId });
        const stored = storeTempConnectionId(tempConnectionId);
        if (!stored) {
          logger.warn('Failed to store temp connection ID, but proceeding');
        }
        cleanup();
        popup.close();
        resolve({ tempConnectionId });
      }
    };

    window.addEventListener('message', handleMessage);

    // Poll for popup closure (fallback if postMessage doesn't work)
    pollInterval = setInterval(() => {
      if (popup.closed) {
        logger.debug('OAuth popup was closed');
        cleanup();

        // Check if we have a temp connection ID from redirect flow
        const tempConnectionId = getTempConnectionId();
        if (tempConnectionId) {
          resolve({ tempConnectionId });
        } else {
          reject(new Error('POPUP_CLOSED'));
        }
      }
    }, 500);

    // Timeout after configured duration
    timeoutId = setTimeout(() => {
      logger.warn('OAuth flow timed out');
      cleanup();
      if (popup && !popup.closed) {
        popup.close();
      }
      reject(new Error('OAUTH_TIMEOUT'));
    }, TIMEOUT_MS);
  });
}

/**
 * Check if popup windows are likely to be blocked
 * This is a heuristic check, not 100% accurate
 */
export function checkPopupSupport(): boolean {
  // Test popup by opening and immediately closing
  const testPopup = window.open('', 'test', 'width=1,height=1');
  if (!testPopup) {
    return false;
  }
  testPopup.close();
  return true;
}

/**
 * Build OAuth URL with state parameter
 */
export function buildOAuthUrlWithState(baseUrl: string, state: string): string {
  const url = new URL(baseUrl);
  // The backend already includes state in the auth URL, but we can append if needed
  // For now, we'll trust the backend to include it
  return url.toString();
}

/**
 * Error types for OAuth flow
 */
export const OAuthErrorTypes = {
  POPUP_BLOCKED: 'POPUP_BLOCKED',
  POPUP_CLOSED: 'POPUP_CLOSED',
  OAUTH_TIMEOUT: 'OAUTH_TIMEOUT',
  STATE_MISMATCH: 'STATE_MISMATCH',
  ACCESS_DENIED: 'ACCESS_DENIED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type OAuthErrorType = (typeof OAuthErrorTypes)[keyof typeof OAuthErrorTypes];

/**
 * Get user-friendly error message for OAuth errors
 */
export function getOAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    switch (error.message) {
      case OAuthErrorTypes.POPUP_BLOCKED:
        return 'Popup was blocked by your browser. Please allow popups for this site.';
      case OAuthErrorTypes.POPUP_CLOSED:
        return 'Authorization window was closed before completing. Please try again.';
      case OAuthErrorTypes.OAUTH_TIMEOUT:
        return 'Authorization timed out. Please try again.';
      case OAuthErrorTypes.STATE_MISMATCH:
        return 'Security validation failed. Please try again.';
      case OAuthErrorTypes.ACCESS_DENIED:
        return 'Access was denied. Please grant the required permissions.';
      default:
        return error.message || 'An unknown error occurred during authorization.';
    }
  }
  return 'An unknown error occurred during authorization.';
}
