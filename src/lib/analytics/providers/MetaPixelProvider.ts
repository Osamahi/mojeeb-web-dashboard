/**
 * Meta Pixel (Facebook Pixel) Provider
 * Sends events to Facebook Pixel for conversion tracking
 */

import type {
  AnalyticsProvider,
  AnalyticsEventName,
  AnalyticsEventPayload,
} from '../types';
import { analyticsConfig } from '../config';

/**
 * Map internal event names to Meta Pixel standard events
 */
const META_EVENT_MAP: Record<string, string> = {
  signup_completed: 'CompleteRegistration',
  checkout_initiated: 'InitiateCheckout',
  subscription_purchased: 'Purchase',
  lead_captured: 'Lead',
  page_view: 'PageView',
};

export class MetaPixelProvider implements AnalyticsProvider {
  name = 'Meta Pixel';
  isEnabled: boolean;

  constructor() {
    this.isEnabled = analyticsConfig.enabledProviders.includes('metaPixel');
  }

  initialize(): void {
    if (!this.isEnabled) return;

    // Meta Pixel is initialized in index.html, so we just verify it exists
    if (typeof window !== 'undefined' && !window.fbq) {
      console.warn('[Meta Pixel] fbq not found. Meta Pixel script may not be loaded.');
      this.isEnabled = false;
    }
  }

  track<T extends AnalyticsEventName>(
    eventName: T,
    payload: AnalyticsEventPayload<T>
  ): void {
    if (!this.isEnabled || typeof window === 'undefined' || !window.fbq) return;

    // Check if event maps to a standard Meta event
    const metaEventName = META_EVENT_MAP[eventName];

    if (metaEventName) {
      // Use standard event
      this.trackStandardEvent(metaEventName, eventName, payload);
    } else {
      // Use custom event
      this.trackCustomEvent(eventName, payload);
    }
  }

  private trackStandardEvent<T extends AnalyticsEventName>(
    metaEventName: string,
    internalEventName: T,
    payload: AnalyticsEventPayload<T>
  ): void {
    if (!window.fbq) return;

    const eventParams = this.transformPayload(internalEventName, payload);

    window.fbq('track', metaEventName, eventParams);

    if (analyticsConfig.debug) {
      console.log('[Meta Pixel] Standard Event:', metaEventName, eventParams);
    }
  }

  private trackCustomEvent<T extends AnalyticsEventName>(
    eventName: T,
    payload: AnalyticsEventPayload<T>
  ): void {
    if (!window.fbq) return;

    const eventParams = {
      timestamp: new Date().toISOString(),
      ...payload,
    };

    // Convert event name to PascalCase for custom events
    const customEventName = this.toPascalCase(eventName);

    window.fbq('trackCustom', customEventName, eventParams);

    if (analyticsConfig.debug) {
      console.log('[Meta Pixel] Custom Event:', customEventName, eventParams);
    }
  }

  /**
   * Transform internal payload to Meta Pixel format
   */
  private transformPayload<T extends AnalyticsEventName>(
    eventName: T,
    payload: AnalyticsEventPayload<T>
  ): Record<string, unknown> {
    switch (eventName) {
      case 'signup_completed': {
        const p = payload as AnalyticsEventPayload<'signup_completed'>;
        return {
          content_name: 'User Signup',
          status: 'completed',
          user_id: p.userId,
          signup_method: p.signupMethod,
        };
      }

      case 'checkout_initiated': {
        const p = payload as AnalyticsEventPayload<'checkout_initiated'>;
        return {
          content_name: `${p.planName} Plan`,
          content_category: 'Subscription',
          value: p.amount,
          currency: p.currency,
        };
      }

      case 'subscription_purchased': {
        const p = payload as AnalyticsEventPayload<'subscription_purchased'>;
        return {
          content_name: `${p.planName} Plan`,
          content_type: 'product',
          value: p.amount,
          currency: p.currency,
        };
      }

      case 'lead_captured': {
        const p = payload as AnalyticsEventPayload<'lead_captured'>;
        return {
          content_name: p.contentName,
          content_category: p.leadSource,
        };
      }

      default:
        return payload;
    }
  }

  /**
   * Convert snake_case to PascalCase
   * Example: agent_created → AgentCreated
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.isEnabled || typeof window === 'undefined' || !window.fbq) return;

    // Meta Pixel doesn't have a dedicated identify method
    // User data is sent with events automatically
    if (analyticsConfig.debug) {
      console.log('[Meta Pixel] User identified:', userId, traits);
    }
  }

  reset(): void {
    if (!this.isEnabled || typeof window === 'undefined' || !window.fbq) return;

    // Meta Pixel doesn't have a reset method
    // User session is tied to cookies
    if (analyticsConfig.debug) {
      console.log('[Meta Pixel] User logged out');
    }
  }
}
