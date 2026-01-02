/**
 * Console Provider
 * Logs all analytics events to console for development/debugging
 */

import type {
  AnalyticsProvider,
  AnalyticsEventName,
  AnalyticsEventPayload,
} from '../types';
import { analyticsConfig } from '../config';

export class ConsoleProvider implements AnalyticsProvider {
  name = 'Console';
  isEnabled: boolean;

  constructor() {
    // Only enable in development or when debug is true
    this.isEnabled = analyticsConfig.debug;
  }

  initialize(): void {
    if (!this.isEnabled) return;
    console.log('[Analytics] Console provider initialized (debug mode)');
  }

  track<T extends AnalyticsEventName>(
    eventName: T,
    payload: AnalyticsEventPayload<T>
  ): void {
    if (!this.isEnabled) return;

    console.group(`📊 [Analytics] ${eventName}`);
    console.log('Payload:', payload);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    console.group('👤 [Analytics] User Identified');
    console.log('User ID:', userId);
    if (traits) {
      console.log('Traits:', traits);
    }
    console.groupEnd();
  }

  reset(): void {
    if (!this.isEnabled) return;
    console.log('🔄 [Analytics] User session reset');
  }
}
