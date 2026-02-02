/**
 * JWT Token Utility Functions
 *
 * Provides utilities for decoding and validating JWT tokens without requiring
 * external libraries. Handles token expiration checks and basic token parsing.
 */

interface JWTPayload {
  exp?: number;
  iat?: number;
  nameid?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

/**
 * Decodes a JWT token payload without verifying signature
 *
 * @param token - The JWT token string
 * @returns Decoded payload object or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');

    if (parts.length !== 3) {
      console.warn('[TokenUtils] Invalid JWT format - expected 3 parts');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Base64 URL decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error('[TokenUtils] Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 *
 * @param token - The JWT token string
 * @param bufferSeconds - Optional buffer time in seconds (default: 30s)
 * @returns true if token is expired or invalid, false otherwise
 */
export function isTokenExpired(token: string, bufferSeconds: number = 30): boolean {
  if (!token) {
    return true;
  }

  const payload = decodeJWT(token);

  if (!payload || !payload.exp) {
    console.warn('[TokenUtils] Token has no expiration claim');
    return true;
  }

  // JWT exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;

  const isExpired = currentTime >= (expirationTime - bufferTime);

  if (isExpired) {
    const expirationDate = new Date(expirationTime);
    console.log(
      `[TokenUtils] Token expired at ${expirationDate.toISOString()} ` +
      `(${Math.floor((currentTime - expirationTime) / 1000)}s ago)`
    );
  }

  return isExpired;
}

/**
 * Gets the remaining time until token expiration
 *
 * @param token - The JWT token string
 * @returns Remaining milliseconds until expiration, or 0 if expired/invalid
 */
export function getTokenRemainingTime(token: string): number {
  if (!token) {
    return 0;
  }

  const payload = decodeJWT(token);

  if (!payload || !payload.exp) {
    return 0;
  }

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const remaining = expirationTime - currentTime;

  return Math.max(0, remaining);
}

/**
 * Extracts user ID from JWT token
 *
 * @param token - The JWT token string
 * @returns User ID (nameid claim) or null if not found
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.nameid || null;
}

/**
 * Checks if a token will expire within a given time window
 *
 * @param token - The JWT token string
 * @param windowMinutes - Time window in minutes (default: 3)
 * @returns true if token expires within the window
 */
export function isTokenExpiringSoon(token: string, windowMinutes: number = 3): boolean {
  const remainingMs = getTokenRemainingTime(token);
  const windowMs = windowMinutes * 60 * 1000;

  return remainingMs > 0 && remainingMs <= windowMs;
}
