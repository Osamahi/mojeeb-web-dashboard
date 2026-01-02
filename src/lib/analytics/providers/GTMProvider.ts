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
    console.log('[GTM] 🔍 Initializing...');
    console.log('[GTM] isEnabled (from config):', this.isEnabled);

    if (!this.isEnabled) {
      console.log('[GTM] ⏭️ Provider disabled in config - skipping initialization');
      return;
    }

    // GTM is initialized in index.html, so we just verify it exists
    console.log('[GTM] 🔍 Checking for window.dataLayer...');
    console.log('[GTM] typeof window:', typeof window);
    console.log('[GTM] typeof window.dataLayer:', typeof window !== 'undefined' ? typeof window.dataLayer : 'window undefined');

    if (typeof window !== 'undefined' && !window.dataLayer) {
      console.error('[GTM] ❌ window.dataLayer NOT FOUND - GTM script not loaded!');
      console.error('[GTM] ❌ DISABLING PROVIDER PERMANENTLY');
      this.isEnabled = false;
      return;
    }

    if (typeof window !== 'undefined' && window.dataLayer) {
      console.log('[GTM] ✅ window.dataLayer found - GTM is ready!');
      console.log('[GTM] Container ID: GTM-PQZD9VM8');
    }
  }

  track<T extends AnalyticsEventName>(
    eventName: T,
    payload: AnalyticsEventPayload<T>
  ): void {
    console.log(`[GTM] 🎯 track() called: "${eventName}"`);
    console.log(`[GTM] isEnabled: ${this.isEnabled}`);

    if (!this.isEnabled) {
      console.error(`[GTM] ⚠️ Provider is DISABLED - cannot track "${eventName}"`);
      return;
    }

    if (typeof window === 'undefined') {
      console.error(`[GTM] ⚠️ window is undefined - cannot track "${eventName}"`);
      return;
    }

    const eventData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    console.log(`[GTM] 📦 Event data:`, eventData);
    console.log(`[GTM] 📤 Pushing to dataLayer...`);
    window.dataLayer.push(eventData);
    console.log(`[GTM] ✅ Event "${eventName}" pushed to dataLayer successfully!`);
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
