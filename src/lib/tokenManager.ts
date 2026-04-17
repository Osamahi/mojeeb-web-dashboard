/**
 * Token Manager - Centralized token storage management with AES encryption
 *
 * This module provides a single source of truth for token operations,
 * breaking the circular dependency between api.ts and authStore.ts.
 * Uses SecureLS for encrypted localStorage to protect sensitive JWT tokens.
 */

import SecureLS from 'secure-ls';
import { logger } from './logger';
import { env } from '@/config/env';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';


/**
 * Stable fallback key used when VITE_TOKEN_ENCRYPTION_KEY is not set.
 *
 * SecureLS is client-side obfuscation (localStorage AES), not real security —
 * anyone with XSS or device access can read the key regardless of how it's
 * derived. The previous implementation derived this from navigator.userAgent
 * and window.screen.*, which are UNSTABLE (change on browser updates, window
 * resizes, monitor connects, device rotation). When the key changed between
 * sessions, SecureLS decrypted stored tokens with a different key than was
 * used to encrypt them, producing "Malformed UTF-8 data" and locking users out.
 *
 * Prefer setting VITE_TOKEN_ENCRYPTION_KEY in production; this constant is
 * the stable dev/safety-net fallback.
 */
const FALLBACK_ENCRYPTION_KEY = 'mojeeb-dashboard-v1-token-obfuscation-key';

const getEncryptionKey = (): string => {
  if (env.VITE_TOKEN_ENCRYPTION_KEY) {
    return env.VITE_TOKEN_ENCRYPTION_KEY;
  }
  return FALLBACK_ENCRYPTION_KEY;
};

// Initialize SecureLS with AES encryption
const secureStorage = new SecureLS({
  encodingType: 'aes',
  isCompression: false, // Disable compression to avoid issues with JWT strings
  encryptionSecret: getEncryptionKey(),
});

/**
 * Store both access and refresh tokens in encrypted localStorage
 * Uses DUAL STORAGE strategy for mobile browser reliability:
 * - Primary: SecureLS (encrypted)
 * - Backup: Plain localStorage
 * This ensures tokens persist even if SecureLS fails on mobile browsers
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (import.meta.env.DEV) {
    console.log('[TokenManager] setTokens called');
  }

  // Always write to plain localStorage first (backup)
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  // Then try to write to SecureLS (encrypted)
  try {
    secureStorage.set(ACCESS_TOKEN_KEY, accessToken);
    secureStorage.set(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    logger.warn('Failed to store tokens in SecureLS, using plain localStorage backup', error);
  }
};

/**
 * Get access token from encrypted localStorage
 */
export const getAccessToken = (): string | null => {
  try {
    const token = secureStorage.get(ACCESS_TOKEN_KEY);
    return token || null;
  } catch (error) {
    logger.error('Failed to retrieve access token securely', error);
    // Fallback to regular localStorage
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
};

/**
 * Get refresh token from encrypted localStorage
 */
export const getRefreshToken = (): string | null => {
  try {
    const token = secureStorage.get(REFRESH_TOKEN_KEY);
    return token || null;
  } catch (error) {
    logger.error('Failed to retrieve refresh token securely', error);
    // Fallback to regular localStorage
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
};

/**
 * Remove both tokens from encrypted localStorage
 * Clears from BOTH SecureLS and plain localStorage (dual storage)
 * GUARANTEES tokens are removed even if SecureLS fails
 */
export function clearTokens(): void {
  if (import.meta.env.DEV) {
    console.log('[TokenManager] clearTokens called');
  }

  let secureCleared = false;
  let plainCleared = false;

  // Step 1: Clear from SecureLS (encrypted storage)
  try {
    secureStorage.remove(ACCESS_TOKEN_KEY);
    secureStorage.remove(REFRESH_TOKEN_KEY);
    secureCleared = true;
    if (import.meta.env.DEV) {
      console.log('[TokenManager] ✓ SecureLS tokens cleared');
    }
  } catch (error) {
    logger.warn('Failed to clear tokens from SecureLS, will force clear');
    console.error(error);

    // Force clear by removing ALL SecureLS data (nuclear option)
    try {
      secureStorage.removeAll();
      secureCleared = true;
      if (import.meta.env.DEV) {
        console.log('[TokenManager] ✓ SecureLS force cleared (removeAll)');
      }
    } catch (removeAllError) {
      logger.error('Failed to force clear SecureLS');
      console.error(removeAllError);
      // Continue to plain localStorage cleanup
    }
  }

  // Step 2: Clear from plain localStorage (backup storage)
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    plainCleared = true;
    if (import.meta.env.DEV) {
      console.log('[TokenManager] ✓ Plain localStorage tokens cleared');
    }
  } catch (error) {
    logger.error('Failed to clear tokens from plain localStorage');
    console.error(error);
    // This should never fail, but log if it does
  }

  // Step 3: Verification - ensure tokens are actually gone
  try {
    const accessStillExists = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshStillExists = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (accessStillExists || refreshStillExists) {
      logger.error('⚠️ CRITICAL: Tokens still exist after clearTokens!');
      console.error({
        accessStillExists: !!accessStillExists,
        refreshStillExists: !!refreshStillExists,
      });

      // Force remove one more time
      try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch (retryError) {
        logger.error('Failed to force remove tokens on retry');
        console.error(retryError);
      }
    }
  } catch (verifyError) {
    // Ignore verification errors
  }

  if (import.meta.env.DEV) {
    console.log('[TokenManager] clearTokens complete', {
      secureCleared,
      plainCleared,
    });
  }
}

/**
 * Check if user has valid tokens (at least refresh token exists)
 */
export const hasTokens = (): boolean => {
  return !!getRefreshToken();
};

/**
 * Check if user has both access and refresh tokens
 */
export const hasValidSession = (): boolean => {
  return !!getAccessToken() && !!getRefreshToken();
};

/**
 * Validate refresh token by attempting to use it for token refresh
 * This is called during rehydration to ensure stored tokens are still valid
 *
 * @param refreshToken - The refresh token to validate
 * @returns Promise resolving to validation result with new tokens if valid
 */
export const validateRefreshToken = async (
  refreshToken: string
): Promise<{ isValid: boolean; tokens?: { accessToken: string; refreshToken: string } }> => {
  try {
    if (import.meta.env.DEV) {
      console.log('[TokenManager] Validating refresh token during rehydration');
    }

    // Import authService dynamically to avoid circular dependencies
    const { authService } = await import('@/features/auth/services/authService');

    // Attempt to refresh tokens - if this succeeds, token is valid
    const tokens = await authService.refreshToken(refreshToken);

    if (tokens.accessToken && tokens.refreshToken) {
      if (import.meta.env.DEV) {
        console.log('[TokenManager] Token validation successful - token is valid');
      }
      return { isValid: true, tokens };
    } else {
      logger.warn('[TokenManager]', 'Token validation failed - no tokens returned');
      return { isValid: false };
    }
  } catch (error) {
    logger.error('[TokenManager]', 'Token validation failed - refresh token is invalid/expired', error);
    return { isValid: false };
  }
};
