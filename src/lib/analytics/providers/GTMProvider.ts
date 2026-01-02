/**
 * Google Tag Manager Provider
 * Sends events to GTM dataLayer
 */

import type {
  AnalyticsProvider,
  AnalyticsEventName,
  AnalyticsEventPayload,
} from '../types';
import { analyticsConfig } from '../config';

export class GTMProvider implements AnalyticsProvider {
  name = 'GTM';
  isEnabled: boolean;

  constructor() {
    this.isEnabled = analyticsConfig.enabledProviders.includes('gtm');
  }

  initialize(): void {
    if (!this.isEnabled) return;

    // GTM is initialized in index.html, so we just verify it exists
    if (typeof window !== 'undefined' && !window.dataLayer) {
      console.warn('[GTM] dataLayer not found. GTM script may not be loaded.');
      this.isEnabled = false;
    }
  }

  track<T extends AnalyticsEventName>(
    eventName: T,
    payload: AnalyticsEventPayload<T>
  ): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    const eventData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    window.dataLayer.push(eventData);

    if (analyticsConfig.debug) {
      console.log('[GTM]', eventName, eventData);
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    window.dataLayer.push({
      event: 'user_identified',
      user_id: userId,
      ...traits,
    });

    if (analyticsConfig.debug) {
      console.log('[GTM] User identified:', userId, traits);
    }
  }

  reset(): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    window.dataLayer.push({
      event: 'user_logout',
    });

    if (analyticsConfig.debug) {
      console.log('[GTM] User logged out');
    }
  }
}
