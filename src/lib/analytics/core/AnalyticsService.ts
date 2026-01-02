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
    if (this.isInitialized) {
      console.warn('[Analytics] Service already initialized');
      return;
    }

    // Register all providers
    this.providers = [
      new GTMProvider(),
      new MetaPixelProvider(),
      new ConsoleProvider(),
    ];

    // Initialize each enabled provider
    this.providers.forEach(provider => {
      if (provider.isEnabled) {
        try {
          provider.initialize();
          if (analyticsConfig.debug) {
            console.log(`[Analytics] ${provider.name} initialized`);
          }
        } catch (error) {
          console.error(`[Analytics] Failed to initialize ${provider.name}:`, error);
          provider.isEnabled = false;
        }
      }
    });

    this.isInitialized = true;

    if (analyticsConfig.debug) {
      const enabledProviders = this.providers
        .filter(p => p.isEnabled)
        .map(p => p.name);
      console.log('[Analytics] Service initialized with providers:', enabledProviders);
    }
  }

  /**
   * Track an event across all enabled providers
   */
  track<T extends AnalyticsEventName>(
    eventName: T,
    payload: AnalyticsEventPayload<T>
  ): void {
    if (!this.isInitialized) {
      console.warn('[Analytics] Service not initialized. Call initialize() first.');
      return;
    }

    // Add user ID to payload if available
    const enrichedPayload = {
      ...payload,
      ...(this.currentUserId && { userId: this.currentUserId }),
    } as AnalyticsEventPayload<T>;

    // Send to all enabled providers
    this.providers.forEach(provider => {
      if (provider.isEnabled) {
        try {
          provider.track(eventName, enrichedPayload);
        } catch (error) {
          console.error(`[Analytics] ${provider.name} failed to track ${eventName}:`, error);
        }
      }
    });
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
}

// Export singleton instance
export const analytics = new AnalyticsService();
