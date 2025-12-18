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
 * Generate a secure encryption key based on environment or browser fingerprint
 * This provides basic obfuscation - for production, use environment variable
 */
const getEncryptionKey = (): string => {
  // Use environment variable if provided (recommended for production)
  if (env.VITE_TOKEN_ENCRYPTION_KEY) {
    return env.VITE_TOKEN_ENCRYPTION_KEY;
  }

  // Fallback: Generate key from browser fingerprint + app identifier
  // NOTE: This is obfuscation, not true security. Set VITE_TOKEN_ENCRYPTION_KEY for production.
  const userAgent = navigator.userAgent;
  const screen = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const appSecret = 'mojeeb-v1'; // App-specific identifier

  const fingerprint = `${userAgent}-${screen}-${timezone}-${appSecret}`;

  // Simple hash function to generate consistent key from fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `mojeeb-${Math.abs(hash).toString(36)}-v1`;
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
  logger.debug('[TokenManager] setTokens called');

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
 */
export const clearTokens = (): void => {
  logger.debug('[TokenManager] clearTokens called');

  // Clear from plain localStorage
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  // Clear from SecureLS
  try {
    secureStorage.remove(ACCESS_TOKEN_KEY);
    secureStorage.remove(REFRESH_TOKEN_KEY);
  } catch (error) {
    logger.warn('Failed to clear tokens from SecureLS', error);
  }
};

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
    logger.debug('[TokenManager] Validating refresh token during rehydration');

    // Import authService dynamically to avoid circular dependencies
    const { authService } = await import('@/features/auth/services/authService');

    // Attempt to refresh tokens - if this succeeds, token is valid
    const tokens = await authService.refreshToken(refreshToken);

    if (tokens.accessToken && tokens.refreshToken) {
      logger.debug('[TokenManager] Token validation successful - token is valid');
      return { isValid: true, tokens };
    } else {
      logger.warn('[TokenManager] Token validation failed - no tokens returned');
      return { isValid: false };
    }
  } catch (error) {
    logger.error('[TokenManager] Token validation failed - refresh token is invalid/expired', error);
    return { isValid: false };
  }
};
