/**
 * Microsoft Clarity Analytics Service
 * Session recording, heatmaps, and UX analytics for production
 */

import Clarity from '@microsoft/clarity';
import { env } from '@/config/env';

// TypeScript declaration for global clarity function
declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * Initialize Microsoft Clarity with environment-specific configuration
 * Only enabled when VITE_CLARITY_PROJECT_ID is provided
 */
export const initializeClarity = (): void => {
  // Only initialize if Project ID is provided
  if (!env.VITE_CLARITY_PROJECT_ID) {
    console.log('ℹ️ Clarity Project ID not provided - session recording disabled');
    return;
  }

  // Skip initialization in development to avoid polluting analytics
  if (import.meta.env.DEV) {
    console.log('ℹ️ Clarity disabled in development mode');
    return;
  }

  try {
    Clarity.init(env.VITE_CLARITY_PROJECT_ID);
    console.log('✅ Microsoft Clarity initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Microsoft Clarity:', error);
  }
};

/**
 * Check if Clarity has started successfully
 */
export const isClarityActive = (): boolean => {
  return typeof window !== 'undefined' && typeof window.clarity === 'function';
};

/**
 * Identify user for session tracking
 * Use user ID only (not email) for privacy
 *
 * @param userId - Unique user identifier
 * @param customSessionId - Optional custom session identifier
 * @param customPageId - Optional custom page identifier
 * @param friendlyName - Optional friendly name
 */
export const identifyClarityUser = (
  userId: string,
  customSessionId?: string,
  customPageId?: string,
  friendlyName?: string
): void => {
  if (!isClarityActive()) return;

  try {
    Clarity.identify(userId, customSessionId, customPageId, friendlyName);
    console.log(`📊 Clarity user identified: ${userId}`);
  } catch (error) {
    console.error('Failed to identify Clarity user:', error);
  }
};

/**
 * Tag current session with custom metadata
 * Useful for segmenting sessions by feature, page, or user action
 *
 * @param key - Tag key (e.g., 'subscription_tier', 'feature_used')
 * @param value - Tag value (e.g., 'premium', 'chat_export')
 */
export const tagClaritySession = (key: string, value: string): void => {
  if (!isClarityActive()) return;

  try {
    Clarity.setTag(key, value);
  } catch (error) {
    console.error('Failed to tag Clarity session:', error);
  }
};

/**
 * Upgrade session for detailed tracking
 * Use this to mark important user flows or critical pages
 * Ensures the session is recorded even if sampling is enabled
 */
export const upgradeClaritySession = (reason = 'important_session'): void => {
  if (!isClarityActive()) return;

  try {
    Clarity.upgrade(reason);
    console.log(`📈 Clarity session upgraded for detailed tracking: ${reason}`);
  } catch (error) {
    console.error('Failed to upgrade Clarity session:', error);
  }
};

/**
 * Send custom event to Clarity
 * Track specific user actions or milestones
 *
 * @param eventName - Name of the custom event
 */
export const trackClarityEvent = (eventName: string): void => {
  if (!isClarityActive()) return;

  try {
    Clarity.event(eventName);
  } catch (error) {
    console.error('Failed to track Clarity event:', error);
  }
};

/**
 * Set cookie consent for Clarity
 * Call this when user accepts/rejects cookies
 *
 * @param hasConsent - Whether user has given consent
 */
export const setClarityConsent = (hasConsent: boolean): void => {
  if (!isClarityActive()) {
    // Consent can be set before Clarity is initialized
    try {
      Clarity.consent(hasConsent);
      console.log(`🍪 Clarity consent set to: ${hasConsent}`);
    } catch (error) {
      console.error('Failed to set Clarity consent:', error);
    }
    return;
  }

  try {
    Clarity.consent(hasConsent);
    console.log(`🍪 Clarity consent set to: ${hasConsent}`);
  } catch (error) {
    console.error('Failed to set Clarity consent:', error);
  }
};

/**
 * Clear user identification (e.g., on logout)
 */
export const clearClarityUser = (): void => {
  if (!isClarityActive()) return;

  try {
    // Clarity doesn't have a direct "clear user" method
    // We tag the session as anonymous instead
    tagClaritySession('userType', 'anonymous');
    console.log('👤 Clarity user cleared');
  } catch (error) {
    console.error('Failed to clear Clarity user:', error);
  }
};

// Export types for better IDE support
export type ClarityTag = {
  key: string;
  value: string;
};
