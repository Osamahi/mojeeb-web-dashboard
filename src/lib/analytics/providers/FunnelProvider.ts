/**
 * Funnel Analytics Provider
 * Self-hosted, server-side funnel tracking from signup → subscription.
 *
 * - Buffers events and flushes every 5s or at 10 events
 * - Uses localStorage session ID for anonymous pre-signup tracking
 * - Dedup is handled server-side via DB unique index (session_id, event_name)
 * - Flushes on page visibility change (tab close/navigate away)
 */

import type {
  AnalyticsProvider,
  AnalyticsEventName,
  AnalyticsEventPayload,
} from '../types';
import { analyticsConfig } from '../config';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { API_URL } from '@/lib/api';

const SESSION_KEY = 'mojeeb_funnel_session';
const FLUSH_INTERVAL_MS = 5_000;
const FLUSH_BATCH_SIZE = 10;
const ENDPOINT = `${API_URL}/api/funnel/events`;

/** Events tracked by the funnel (others are ignored) */
const FUNNEL_EVENTS = new Set<string>([
  'signup_page_view',
  // NOTE: signup_completed is NOT here — fired server-side only (AuthController)
  'onboarding_started',
  'onboarding_step1_completed',
  'onboarding_step2_completed',
  'onboarding_step3_completed',
  'agent_created',
  'onboarding_skipped',
  'first_dashboard_visit',
  'knowledge_base_added',
  'first_test_chat',
  'channel_connected',
  'subscription_page_visited',
  'checkout_initiated',
  // NOTE: subscription_purchased is NOT here — fired server-side only (Stripe webhook)
]);

interface BufferedEvent {
  event_name: string;
  session_id: string;
  properties: Record<string, unknown>;
  client_timestamp: string;
  referrer?: string;
  signup_method?: string;
}

export class FunnelProvider implements AnalyticsProvider {
  name = 'Funnel';
  isEnabled: boolean;

  private buffer: BufferedEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;

  constructor() {
    this.isEnabled = analyticsConfig.enabledProviders.includes('funnel');
    this.sessionId = this.getOrCreateSessionId();
  }

  initialize(): void {
    if (!this.isEnabled) return;

    // Start periodic flush
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

    // Flush on page hide (tab close, navigate away)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush(true); // use sendBeacon
        }
      });
    }
  }

  track<T extends AnalyticsEventName>(
    eventName: T,
    payload: AnalyticsEventPayload<T>
  ): void {
    if (!this.isEnabled) return;

    const name = eventName as string;

    // Only track funnel events — all others are ignored
    if (!FUNNEL_EVENTS.has(name)) return;

    // No client-side dedup — backend DB unique index handles it.
    // Duplicates are silently rejected by the server (expected behavior).

    const event: BufferedEvent = {
      event_name: name,
      session_id: this.sessionId,
      properties: { ...(payload as Record<string, unknown>) },
      client_timestamp: new Date().toISOString(),
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    };

    this.buffer.push(event);

    // Auto-flush if buffer is full
    if (this.buffer.length >= FLUSH_BATCH_SIZE) {
      this.flush();
    }
  }

  identify(_userId: string, _traits?: Record<string, unknown>): void {
    // No-op: user_id is set server-side from JWT
  }

  reset(): void {
    // Generate new session for next user on logout
    try {
      this.sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, this.sessionId);
    } catch {
      // localStorage may not be available
    }
  }

  // --- Private ---

  private getOrCreateSessionId(): string {
    try {
      const existing = localStorage.getItem(SESSION_KEY);
      if (existing) return existing;

      const id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
      return id;
    } catch {
      return crypto.randomUUID();
    }
  }

  private flush(useBeacon = false): void {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    const body = JSON.stringify({ events });

    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(ENDPOINT, blob);
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body,
      keepalive: true,
    }).catch(() => {
      // Re-enqueue failed events for next flush
      this.buffer.unshift(...events);
    });
  }
}
