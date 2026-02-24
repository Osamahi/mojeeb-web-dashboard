/**
 * Platform Constants and Metadata
 * Centralized platform definitions for connections/integrations
 */

import type { PlatformType } from '../types';

/**
 * Platform availability status
 */
export type PlatformStatus = 'available' | 'coming_soon';

/**
 * Platform metadata for UI display
 */
export type PlatformMetadata = {
  id: PlatformType;
  name: string;
  description: string;
  status: PlatformStatus;
  /** Whether this platform uses OAuth flow */
  usesOAuth: boolean;
  /** Whether this platform shows widget snippet instead of connection */
  showsWidget: boolean;
  /** Category for grouping (future feature) */
  category: 'social' | 'messaging' | 'website' | 'other';
  /** Brand color for the platform */
  brandColor: string;
  /** Light background color matching brand */
  brandBgColor: string;
  /** Whether this platform requires SuperAdmin role (0) to access */
  requiresSuperAdmin?: boolean;
};

/**
 * All available platforms with their metadata
 * Order determines display order in the UI
 */
export const PLATFORMS: PlatformMetadata[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Connect your Facebook Business Page to receive and respond to messages',
    status: 'available',
    usesOAuth: true,
    showsWidget: false,
    category: 'social',
    brandColor: '#1877F2',
    brandBgColor: '#E7F3FF',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect your Instagram Business Account to manage DMs and comments',
    status: 'available',
    usesOAuth: true,
    showsWidget: false,
    category: 'social',
    brandColor: '#E4405F',
    brandBgColor: '#FCE7EB',
  },
  {
    id: 'widget',
    name: 'Website',
    description: 'Embed Mojeeb chat widget on your website to engage visitors',
    status: 'available',
    usesOAuth: false,
    showsWidget: true,
    category: 'website',
    brandColor: '#00bd6f', // Mojeeb green
    brandBgColor: '#E6F9F3',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Connect your WhatsApp Business account to automate customer conversations',
    status: 'available',
    usesOAuth: true,
    showsWidget: false,
    category: 'messaging',
    brandColor: '#25D366',
    brandBgColor: '#E8F8EE',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Manage TikTok comments and direct messages from your account',
    status: 'coming_soon',
    usesOAuth: false,
    showsWidget: false,
    category: 'social',
    brandColor: '#000000',
    brandBgColor: '#F3F4F6',
  },
];

/**
 * Get platform metadata by ID
 */
export function getPlatformById(id: PlatformType): PlatformMetadata | undefined {
  return PLATFORMS.find(p => p.id === id);
}

/**
 * Get all available platforms (not coming soon)
 */
export function getAvailablePlatforms(): PlatformMetadata[] {
  return PLATFORMS.filter(p => p.status === 'available');
}

/**
 * Get all coming soon platforms
 */
export function getComingSoonPlatforms(): PlatformMetadata[] {
  return PLATFORMS.filter(p => p.status === 'coming_soon');
}

/**
 * Get platforms by category
 */
export function getPlatformsByCategory(category: PlatformMetadata['category']): PlatformMetadata[] {
  return PLATFORMS.filter(p => p.category === category);
}

/**
 * Check if platform uses OAuth flow
 */
export function platformUsesOAuth(platformId: PlatformType): boolean {
  const platform = getPlatformById(platformId);
  return platform?.usesOAuth ?? false;
}

/**
 * Check if platform shows widget snippet
 */
export function platformShowsWidget(platformId: PlatformType): boolean {
  const platform = getPlatformById(platformId);
  return platform?.showsWidget ?? false;
}

/**
 * Get the effective platform status based on user role
 * If a platform requires SuperAdmin and user is not SuperAdmin (role !== 0),
 * it will be shown as 'coming_soon' regardless of actual status
 *
 * @param platform - The platform metadata
 * @param userRole - The user's role (0 = SuperAdmin, 1 = Admin, 2 = Customer, etc.)
 * @returns The effective status to display to the user
 */
export function getEffectivePlatformStatus(
  platform: PlatformMetadata,
  userRole?: number
): PlatformStatus {
  // If platform requires SuperAdmin and user is not SuperAdmin
  if (platform.requiresSuperAdmin && userRole !== 0) {
    return 'coming_soon';
  }

  // Otherwise, return the platform's actual status
  return platform.status;
}

/**
 * Check if user can access a platform based on their role
 *
 * @param platform - The platform metadata
 * @param userRole - The user's role (0 = SuperAdmin, 1 = Admin, 2 = Customer, etc.)
 * @returns true if user can access, false if shown as coming soon
 */
export function canUserAccessPlatform(
  platform: PlatformMetadata,
  userRole?: number
): boolean {
  // If platform requires SuperAdmin, check if user is SuperAdmin
  if (platform.requiresSuperAdmin) {
    return userRole === 0;
  }

  // Otherwise, check if platform is actually available
  return platform.status === 'available';
}
