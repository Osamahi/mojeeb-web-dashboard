/**
 * Connection Feature Constants
 * Centralized configuration values for the connections feature
 */

import type { PlatformType } from './types';

/**
 * Meta platforms that support health monitoring
 */
export const META_PLATFORMS: readonly PlatformType[] = ['facebook', 'instagram'] as const;

/**
 * Check if a platform is a Meta platform (supports health monitoring)
 */
export function isMetaPlatform(platform: PlatformType): boolean {
  return META_PLATFORMS.includes(platform);
}

/**
 * Cache/Stale time configuration (in milliseconds)
 */
export const CACHE_TIMES = {
  /** Connections don't change often */
  CONNECTIONS: 5 * 60 * 1000, // 5 minutes
  /** Health checks are expensive API calls */
  HEALTH_CHECK: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Token expiry warning thresholds (in days)
 */
export const EXPIRY_THRESHOLDS = {
  /** Show warning icon when token expires within this many days */
  WARNING: 7,
} as const;

/**
 * API endpoint paths
 */
export const API_PATHS = {
  CONNECTIONS: '/api/social/connections',
  CONNECTION: (id: string) => `/api/social/connections/${id}`,
  HEALTH_CHECK: (id: string) => `/api/FacebookBusinessOAuth/check-health/${id}`,
} as const;

/**
 * Valid platform types for runtime validation
 */
export const VALID_PLATFORMS: readonly PlatformType[] = [
  'web',
  'widget',
  'facebook',
  'instagram',
  'whatsapp',
  'tiktok',
  'twitter',
  'linkedin',
] as const;
