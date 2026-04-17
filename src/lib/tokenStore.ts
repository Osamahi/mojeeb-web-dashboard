/**
 * Token Store — the single source of truth for auth token storage.
 *
 * Replaces the old tokenManager.ts + SecureLS + storageMonitor combo.
 *
 * Design:
 *  - Access token lives in a module-level variable (in memory only). It is
 *    NEVER persisted; a new one is obtained via /refresh on every page load.
 *  - Refresh token lives in plain localStorage. It is the long-lived credential
 *    that proves "this session exists." Yes, XSS can read it — SecureLS was
 *    pure obfuscation (the key was in the bundle) so removing it is neutral.
 *    The real mitigation is CSP + eventually moving to httpOnly cookies; both
 *    require backend changes that are out of scope.
 *
 * Legacy migration:
 *  - Old code stored tokens under localStorage keys "accessToken" / "refreshToken"
 *    (both plain and SecureLS-encrypted). We migrate the plain refresh token
 *    to the new key on first import so existing sessions survive the refactor.
 *  - SecureLS metadata + its encrypted entries are purged on first import too.
 */
import { logger } from './logger';

// New storage key — namespaced so it can't collide with app data.
const REFRESH_TOKEN_KEY = 'mojeeb.refreshToken';

// Legacy keys we need to clean up (and, for refreshToken, migrate from).
const LEGACY_ACCESS_TOKEN_KEY = 'accessToken';
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken';
const LEGACY_SECURELS_PREFIX = '_secure__ls__';

/**
 * In-memory access token. Cleared on page reload.
 * Callers MUST treat this as ephemeral — if null, call /refresh to get one.
 */
let accessToken: string | null = null;

/**
 * One-time migration + cleanup, run when this module first loads.
 * Safe to run on every load — it's idempotent and fast.
 */
function migrateAndCleanup(): void {
  try {
    // 1. Migrate the legacy plain-localStorage refresh token to the new key
    //    (only if the new key is empty — don't overwrite newer data).
    const legacyRefresh = localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
    if (legacyRefresh && !localStorage.getItem(REFRESH_TOKEN_KEY)) {
      localStorage.setItem(REFRESH_TOKEN_KEY, legacyRefresh);
    }

    // 2. Purge legacy plain access token — it's either expired or about to be
    //    (TTL is 15min) and we don't persist access tokens anymore.
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);

    // 3. Purge legacy SecureLS entries. Their ciphertext was keyed on an
    //    unstable browser fingerprint and is effectively dead bytes now.
    //    SecureLS also stored a few metadata keys (_secure__ls__metadata etc).
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LEGACY_SECURELS_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    // SecureLS also wrote the ciphertext under the same "accessToken" /
    // "refreshToken" keys. We already cleared accessToken above; the legacy
    // plain refresh token was migrated first, so clearing "refreshToken"
    // here is safe.
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    // localStorage can throw (Safari private mode, quota exceeded, etc).
    // Don't crash the app — migration is best-effort.
    logger.warn('[tokenStore] Legacy migration failed', error);
  }
}

// Run migration exactly once on module load.
migrateAndCleanup();

/**
 * Get the in-memory access token, or null if none is held.
 */
export const getAccessToken = (): string | null => accessToken;

/**
 * Get the persisted refresh token, or null if none exists.
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Store both tokens. Access token goes in memory; refresh token to localStorage.
 */
export const setTokens = (access: string, refresh: string): void => {
  accessToken = access;
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } catch (error) {
    // Quota exceeded / private mode / disabled storage. Refresh token loss
    // means the next page load will redirect to /login, which is correct
    // fallback behavior rather than a silent bug.
    logger.error('[tokenStore] Failed to persist refresh token', error);
  }
};

/**
 * Clear both tokens. Used on logout and on unrecoverable refresh failures.
 */
export const clearTokens = (): void => {
  accessToken = null;
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // Belt-and-suspenders: also clear any legacy keys that might have crept
    // back in (rare — would require code we missed still writing them).
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
  } catch (error) {
    logger.error('[tokenStore] Failed to clear refresh token', error);
  }
};

/**
 * True if a refresh token exists (session can potentially be restored).
 */
export const hasSession = (): boolean => !!getRefreshToken();
