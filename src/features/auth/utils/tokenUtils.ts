/**
 * JWT Token Utility Functions
 *
 * Provides utilities for decoding and validating JWT tokens without requiring
 * external libraries. Handles token expiration checks and basic token parsing.
 */
import { logger } from '@/lib/logger';

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
    // Fast-path: empty / falsy / non-string inputs are legitimately "no token",
    // not "bad token". Return null silently so the warning below is meaningful
    // when it DOES fire.
    if (!token || typeof token !== 'string' || token.length === 0) {
      return null;
    }

    // JWT format: header.payload.signature
    const parts = token.split('.');

    if (parts.length !== 3) {
      // Genuine bug signal: someone passed a non-JWT (e.g. an opaque refresh
      // token, or ciphertext from legacy SecureLS) where a JWT was expected.
      logger.warn('[TokenUtils] Invalid JWT format', {
        partsCount: parts.length,
        tokenLength: token.length,
      });
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
    logger.error(
      '[TokenUtils] Failed to decode JWT',
      error instanceof Error ? error : new Error(String(error)),
    );
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
    logger.warn('[TokenUtils] Token has no expiration claim');
    return true;
  }

  // JWT exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;

  return currentTime >= (expirationTime - bufferTime);
}

