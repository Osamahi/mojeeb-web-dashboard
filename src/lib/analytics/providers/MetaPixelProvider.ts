/**
 * Meta Pixel (Facebook Pixel) Provider
 *
 * IMPORTANT: This provider handles PageView ONLY.
 * All conversion events (CompleteRegistration, Purchase, InitiateCheckout,
 * AgentCreated, etc.) are sent server-side via Facebook Conversions API (CAPI)
 * from the .NET backend. This avoids duplicate events and provides better
 * match quality since the server sends hashed PII (email, phone, name).
 *
 * See: MojeebBackEnd/Services/Facebook/Application/Capi/
 */

import type {
  AnalyticsProvider,
  AnalyticsEventName,
  AnalyticsEventPayload,
} from '../types';
import { analyticsConfig } from '../config';

export class MetaPixelProvider implements AnalyticsProvider {
  name = 'Meta Pixel';
  isEnabled: boolean;

  constructor() {
    this.isEnabled = analyticsConfig.enabledProviders.includes('metaPixel');
  }

  initialize(): void {
    if (!this.isEnabled) return;

    if (typeof window !== 'undefined' && !window.fbq) {
      console.warn('[Meta Pixel] window.fbq not found - disabling provider');
      this.isEnabled = false;
      return;
    }

    if (analyticsConfig.debug) {
      console.log('[Meta Pixel] Initialized (PageView only — conversions via CAPI)');
    }
  }

  track<T extends AnalyticsEventName>(
    eventName: T,
    _payload: AnalyticsEventPayload<T>
  ): void {
    if (!this.isEnabled || typeof window === 'undefined' || !window.fbq) return;

    // Only send PageView from the browser pixel.
    // All conversion events are handled server-side via CAPI to avoid
    // duplicate counting and improve Event Match Quality.
    if (eventName !== 'page_view') {
      if (analyticsConfig.debug) {
        console.log(`[Meta Pixel] Skipped "${eventName}" — handled by CAPI`);
      }
      return;
    }

    window.fbq('track', 'PageView');

    if (analyticsConfig.debug) {
      console.log('[Meta Pixel] PageView tracked');
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.isEnabled || typeof window === 'undefined' || !window.fbq) return;

    if (analyticsConfig.debug) {
      console.log('[Meta Pixel] User identified:', userId, traits);
    }
  }

  reset(): void {
    if (!this.isEnabled || typeof window === 'undefined' || !window.fbq) return;

    if (analyticsConfig.debug) {
      console.log('[Meta Pixel] User reset');
    }
  }
}
