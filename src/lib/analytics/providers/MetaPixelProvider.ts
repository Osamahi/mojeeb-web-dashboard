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

    if (typeof window !== 'undefined' && !window.fbq) {
      console.warn('[Meta Pixel] window.fbq not found - disabling provider');
      this.isEnabled = false;
      return;
    }

    if (analyticsConfig.debug) {
      console.log('[Meta Pixel] Initialized');
    }
  }

  track<T extends AnalyticsEventName>(
    eventName: T,
    payload: AnalyticsEventPayload<T>
  ): void {
    if (!this.isEnabled || typeof window === 'undefined' || !window.fbq) return;

    const metaEventName = META_EVENT_MAP[eventName];

    if (metaEventName) {
      this.trackStandardEvent(metaEventName, eventName, payload);
    } else {
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
