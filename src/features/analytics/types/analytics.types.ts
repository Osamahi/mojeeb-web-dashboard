/**
 * Live per-agent analytics types.
 *
 * Mirrors the backend contract from MojeebBackEnd/Services/Analytics/.
 * The wire format is snake_case (Newtonsoft.Json on the backend);
 * services transform to camelCase before exposing to components.
 */

// ============================================================================
// Wire-format (snake_case) — what comes off the API
// ============================================================================

export interface MetricsTimeseriesPointWire {
  bucket_at: string;
  value: number | null;
}

export interface MetricsTimeseriesWire {
  agent_id: string;
  metric: AnalyticsMetric;
  granularity_minutes: number;
  from: string;
  to: string;
  points: MetricsTimeseriesPointWire[];
}

export interface AngryConversationWire {
  conversation_id: string;
  first_became_angry_at: string;
  first_sentiment_value: number;
  source_id: string | null;
  customer_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  status: number | null;
}

// ============================================================================
// Frontend-facing (camelCase) — what components consume
// ============================================================================

export type AnalyticsMetric = 'messages' | 'sentiment' | 'angry' | 'actions';

export interface MetricsTimeseriesPoint {
  bucketAt: string;
  value: number | null;
}

export interface MetricsTimeseries {
  agentId: string;
  metric: AnalyticsMetric;
  granularityMinutes: number;
  from: string;
  to: string;
  points: MetricsTimeseriesPoint[];
}

export interface AngryConversation {
  conversationId: string;
  firstBecameAngryAt: string;
  firstSentimentValue: number;
  sourceId: string | null;
  customerName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  status: number | null;
}

// ============================================================================
// Window/granularity presets used by the dashboard chart toggle
// ============================================================================

export type TimeseriesWindow = '1h' | '24h' | '7d' | '30d';

export interface TimeseriesWindowConfig {
  fromOffsetMs: number;
  defaultGranularityMinutes: number;
}

export const TIMESERIES_WINDOWS: Record<TimeseriesWindow, TimeseriesWindowConfig> = {
  '1h':  { fromOffsetMs: 60 * 60 * 1000,            defaultGranularityMinutes: 1   },
  '24h': { fromOffsetMs: 24 * 60 * 60 * 1000,       defaultGranularityMinutes: 5   },
  '7d':  { fromOffsetMs: 7 * 24 * 60 * 60 * 1000,   defaultGranularityMinutes: 60  },
  '30d': { fromOffsetMs: 30 * 24 * 60 * 60 * 1000,  defaultGranularityMinutes: 1440 },
};
