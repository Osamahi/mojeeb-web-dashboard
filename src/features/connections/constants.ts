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
  // OAuth endpoints
  OAUTH_AUTHORIZE: '/api/FacebookBusinessOAuth/authorize',
  OAUTH_PAGES: (tempConnectionId: string) => `/api/FacebookBusinessOAuth/pages/${tempConnectionId}`,
  OAUTH_CONNECT_PAGE: '/api/FacebookBusinessOAuth/connect-page',
} as const;

/**
 * OAuth configuration
 */
export const OAUTH_CONFIG = {
  /** Popup window dimensions */
  POPUP_WIDTH: 600,
  POPUP_HEIGHT: 700,
  /** Timeout for OAuth flow (5 minutes) */
  TIMEOUT_MS: 5 * 60 * 1000,
  /** Storage keys for OAuth state */
  STORAGE_KEYS: {
    STATE: 'oauth_state',
    TEMP_CONNECTION_ID: 'oauth_temp_connection_id',
    PLATFORM: 'oauth_platform',
  },
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
