/**
 * Token Manager - Centralized token storage management with AES encryption
 *
 * This module provides a single source of truth for token operations,
 * breaking the circular dependency between api.ts and authStore.ts.
 * Uses SecureLS for encrypted localStorage to protect sensitive JWT tokens.
 */

import SecureLS from 'secure-ls';
import { logger } from './logger';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Initialize SecureLS with AES encryption
const secureStorage = new SecureLS({
  encodingType: 'aes',
  isCompression: false, // Disable compression to avoid issues with JWT strings
  encryptionSecret: 'mojeeb-secure-tokens-v1', // Secret key for AES encryption
});

/**
 * Store both access and refresh tokens in encrypted localStorage
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  try {
    secureStorage.set(ACCESS_TOKEN_KEY, accessToken);
    secureStorage.set(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    logger.error('Failed to store tokens securely', error);
    // Fallback to regular localStorage if encryption fails
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
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
 */
export const clearTokens = (): void => {
  try {
    secureStorage.remove(ACCESS_TOKEN_KEY);
    secureStorage.remove(REFRESH_TOKEN_KEY);
  } catch (error) {
    logger.error('Failed to clear tokens securely', error);
    // Fallback to regular localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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
