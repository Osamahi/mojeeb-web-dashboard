/**
 * Analytics Service
 * Main orchestrator for all analytics providers
 */

import type {
  AnalyticsProvider,
  AnalyticsEventName,
  AnalyticsEventPayload,
} from '../types';
import { GTMProvider } from '../providers/GTMProvider';
import { MetaPixelProvider } from '../providers/MetaPixelProvider';
import { ConsoleProvider } from '../providers/ConsoleProvider';
import { analyticsConfig } from '../config';

class AnalyticsService {
  private providers: AnalyticsProvider[] = [];
  private isInitialized = false;
  private currentUserId: string | null = null;

  /**
   * Initialize all enabled providers
   */
  initialize(): void {
    console.log('[Analytics] 🚀 Initializing service...');

    if (this.isInitialized) {
      console.warn('[Analytics] ⚠️ Service already initialized - skipping');
      return;
    }

    // Register all providers
    console.log('[Analytics] 📦 Registering providers: GTM, Meta Pixel, Console');
    this.providers = [
      new GTMProvider(),
      new MetaPixelProvider(),
      new ConsoleProvider(),
    ];

    // Initialize each enabled provider
    console.log('[Analytics] 🔧 Initializing providers...');
    this.providers.forEach(provider => {
      if (provider.isEnabled) {
        try {
          console.log(`[Analytics] → Initializing ${provider.name}...`);
          provider.initialize();
          console.log(`[Analytics] ✅ ${provider.name} initialized successfully`);
        } catch (error) {
          console.error(`[Analytics] ❌ Failed to initialize ${provider.name}:`, error);
          provider.isEnabled = false;
        }
      } else {
        console.log(`[Analytics] ⏭️ ${provider.name} is disabled - skipping`);
      }
    });

    this.isInitialized = true;

    const enabledProviders = this.providers
      .filter(p => p.isEnabled)
      .map(p => p.name);
    const disabledProviders = this.providers
      .filter(p => !p.isEnabled)
      .map(p => p.name);

    console.log('[Analytics] ✅ Service initialized successfully');
    console.log(`[Analytics] 📊 Enabled providers (${enabledProviders.length}):`, enabledProviders);
    if (disabledProviders.length > 0) {
      console.log(`[Analytics] ⚠️ Disabled providers (${disabledProviders.length}):`, disabledProviders);
    }
  }

  /**
   * Track an event across all enabled providers
   */
  track<T extends AnalyticsEventName>(
    eventName: T,
    payload: AnalyticsEventPayload<T>
  ): void {
    console.log(`[AnalyticsService] 🎯 track() called: "${eventName}"`);
    console.log(`[AnalyticsService] Payload keys:`, Object.keys(payload));

    if (!this.isInitialized) {
      console.error('[AnalyticsService] ❌ Service NOT INITIALIZED - event will be dropped!');
      console.error('[AnalyticsService] Event:', eventName, '| Payload:', payload);
      return;
    }

    console.log(`[AnalyticsService] ✅ Service initialized, proceeding...`);

    // Add user ID to payload if available
    const enrichedPayload = {
      ...payload,
      ...(this.currentUserId && { userId: this.currentUserId }),
    } as AnalyticsEventPayload<T>;

    if (this.currentUserId) {
      console.log(`[AnalyticsService] 👤 Enriched with userId: ${this.currentUserId}`);
    }

    // Count enabled providers
    const enabledProviders = this.providers.filter(p => p.isEnabled);
    console.log(`[AnalyticsService] 📤 Sending to ${enabledProviders.length} enabled provider(s)...`);

    // Send to all enabled providers
    this.providers.forEach(provider => {
      if (provider.isEnabled) {
        try {
          console.log(`[AnalyticsService] → Sending to ${provider.name}...`);
          provider.track(eventName, enrichedPayload);
          console.log(`[AnalyticsService] ✅ ${provider.name} completed`);
        } catch (error) {
          console.error(`[AnalyticsService] ❌ ${provider.name} failed to track ${eventName}:`, error);
        }
      } else {
        console.log(`[AnalyticsService] ⏭️ ${provider.name} is disabled - skipping`);
      }
    });

    console.log(`[AnalyticsService] ✅ track() completed for "${eventName}"`);
  }

  /**
   * Identify the current user
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      console.warn('[Analytics] Service not initialized. Call initialize() first.');
      return;
    }

    this.currentUserId = userId;

    this.providers.forEach(provider => {
      if (provider.isEnabled) {
        try {
          provider.identify(userId, traits);
        } catch (error) {
          console.error(`[Analytics] ${provider.name} failed to identify user:`, error);
        }
      }
    });
  }

  /**
   * Reset user session (on logout)
   */
  reset(): void {
    if (!this.isInitialized) {
      console.warn('[Analytics] Service not initialized. Call initialize() first.');
      return;
    }

    this.currentUserId = null;

    this.providers.forEach(provider => {
      if (provider.isEnabled) {
        try {
          provider.reset();
        } catch (error) {
          console.error(`[Analytics] ${provider.name} failed to reset:`, error);
        }
      }
    });
  }

  /**
   * Get list of enabled providers
   */
  getEnabledProviders(): string[] {
    return this.providers
      .filter(p => p.isEnabled)
      .map(p => p.name);
  }

  /**
   * Check if service is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Get comprehensive analytics status (for debugging)
   */
  getStatus(): {
    isInitialized: boolean;
    currentUserId: string | null;
    providers: Array<{ name: string; enabled: boolean }>;
  } {
    return {
      isInitialized: this.isInitialized,
      currentUserId: this.currentUserId,
      providers: this.providers.map(p => ({
        name: p.name,
        enabled: p.isEnabled,
      })),
    };
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
