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
 * Safely preview a token for logging (first 10 + last 10 chars)
 */
const previewToken = (token: string | null): string => {
  if (!token) return 'null';
  if (token.length < 25) return `<short:${token.length}chars>`;
  return `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
};

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
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  const timestamp = new Date().toISOString();
  console.log(`🔐 [TokenManager] setTokens called at ${timestamp}`);
  console.log(`   📝 Access Token: ${previewToken(accessToken)} (${accessToken.length} chars)`);
  console.log(`   📝 Refresh Token: ${previewToken(refreshToken)} (${refreshToken.length} chars)`);

  console.time('⏱️ TOKEN-MANAGER: setTokens total');
  try {
    console.time('⏱️ TOKEN-MANAGER: secureStorage.set accessToken');
    secureStorage.set(ACCESS_TOKEN_KEY, accessToken);
    console.timeEnd('⏱️ TOKEN-MANAGER: secureStorage.set accessToken');
    console.log(`   ✅ Access token saved successfully`);

    console.time('⏱️ TOKEN-MANAGER: secureStorage.set refreshToken');
    secureStorage.set(REFRESH_TOKEN_KEY, refreshToken);
    console.timeEnd('⏱️ TOKEN-MANAGER: secureStorage.set refreshToken');
    console.log(`   ✅ Refresh token saved successfully`);
  } catch (error) {
    console.error(`   ❌ SecureLS failed, using fallback localStorage`, error);
    logger.error('Failed to store tokens securely', error);
    // Fallback to regular localStorage if encryption fails
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    console.log(`   ⚠️ Tokens saved to plain localStorage (fallback)`);
  }
  console.timeEnd('⏱️ TOKEN-MANAGER: setTokens total');
};

/**
 * Get access token from encrypted localStorage
 */
export const getAccessToken = (): string | null => {
  console.log(`🔑 [TokenManager] getAccessToken called at ${new Date().toISOString()}`);
  try {
    const token = secureStorage.get(ACCESS_TOKEN_KEY);
    if (token) {
      console.log(`   ✅ Access token retrieved: ${previewToken(token)} (${token.length} chars)`);
    } else {
      console.log(`   ⚠️ No access token found in SecureLS`);
    }
    return token || null;
  } catch (error) {
    console.error(`   ❌ SecureLS retrieval failed, trying fallback`, error);
    logger.error('Failed to retrieve access token securely', error);
    // Fallback to regular localStorage
    const fallbackToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    console.log(`   ${fallbackToken ? '✅' : '⚠️'} Fallback token: ${previewToken(fallbackToken)}`);
    return fallbackToken;
  }
};

/**
 * Get refresh token from encrypted localStorage
 */
export const getRefreshToken = (): string | null => {
  console.log(`🔑 [TokenManager] getRefreshToken called at ${new Date().toISOString()}`);
  try {
    const token = secureStorage.get(REFRESH_TOKEN_KEY);
    if (token) {
      console.log(`   ✅ Refresh token retrieved: ${previewToken(token)} (${token.length} chars)`);
    } else {
      console.log(`   ⚠️ No refresh token found in SecureLS`);
    }
    return token || null;
  } catch (error) {
    console.error(`   ❌ SecureLS retrieval failed, trying fallback`, error);
    logger.error('Failed to retrieve refresh token securely', error);
    // Fallback to regular localStorage
    const fallbackToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    console.log(`   ${fallbackToken ? '✅' : '⚠️'} Fallback token: ${previewToken(fallbackToken)}`);
    return fallbackToken;
  }
};

/**
 * Remove both tokens from encrypted localStorage
 */
export const clearTokens = (): void => {
  console.log(`🗑️  [TokenManager] clearTokens called at ${new Date().toISOString()}`);
  try {
    secureStorage.remove(ACCESS_TOKEN_KEY);
    secureStorage.remove(REFRESH_TOKEN_KEY);
    console.log(`   ✅ Tokens cleared successfully from SecureLS`);
  } catch (error) {
    console.error(`   ❌ SecureLS clear failed, using fallback`, error);
    logger.error('Failed to clear tokens securely', error);
    // Fallback to regular localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    console.log(`   ✅ Tokens cleared from plain localStorage (fallback)`);
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
