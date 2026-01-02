/**
 * Analytics Configuration
 * Centralized configuration for all analytics providers
 */

import type { AnalyticsConfig } from './types';

/**
 * Get analytics configuration from environment variables
 */
export const analyticsConfig: AnalyticsConfig = {
  // Enable/disable providers globally (can be overridden by env vars)
  enabledProviders: [
    'gtm',
    'metaPixel',
    // 'googleAnalytics', // Uncomment when ready
    // 'linkedIn',        // Uncomment when ready
  ].filter(provider => {
    // Check if provider is enabled in env (optional)
    const envKey = `VITE_ANALYTICS_${provider.toUpperCase()}_ENABLED`;
    const envValue = import.meta.env[envKey];
    return envValue === undefined || envValue === 'true';
  }),

  // Debug mode - logs all events to console
  debug: import.meta.env.DEV,

  // Google Tag Manager
  gtm: {
    containerId: 'GTM-PQZD9VM8',
  },

  // Meta Pixel (Facebook Pixel)
  metaPixel: {
    pixelId: '2334159923685300',
  },

  // Google Analytics 4 (optional - add when ready)
  // googleAnalytics: {
  //   measurementId: 'G-XXXXXXXXXX',
  // },
};

/**
 * Check if a provider is enabled
 */
export const isProviderEnabled = (providerName: string): boolean => {
  return analyticsConfig.enabledProviders.includes(providerName);
};
