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
  // Backend echoes the metric name. For /timeseries it's one of
  // AnalyticsMetric; for /active-conversations and /new-conversations it's
  // 'active_conversations' / 'new_conversations'. Loosening to string keeps
  // the wire type reusable across all timeseries endpoints.
  metric: string;
  granularity_minutes: number;
  from: string;
  to: string;
  /** Window-level scalar for the tile. Null when the aggregation isn't
   *  composable from buckets (e.g. sentiment). */
  total: number | null;
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
  // Same as wire — loosened to string so this type is reusable across
  // /timeseries, /active-conversations, /new-conversations.
  metric: string;
  granularityMinutes: number;
  from: string;
  to: string;
  /** Window-level scalar for the tile. Null when the aggregation isn't
   *  composable from buckets (e.g. sentiment). */
  total: number | null;
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
}

/**
 * Frontend window presets — only the time-range offset. Granularity is
 * resolved server-side (see backend AnalyticsQueryService.ComputeGranularityMinutes)
 * and echoed back in each response so the chart knows the bucket size.
 */
export const TIMESERIES_WINDOWS: Record<TimeseriesWindow, TimeseriesWindowConfig> = {
  '1h':  { fromOffsetMs: 60 * 60 * 1000           },
  '24h': { fromOffsetMs: 24 * 60 * 60 * 1000      },
  '7d':  { fromOffsetMs: 7 * 24 * 60 * 60 * 1000  },
  '30d': { fromOffsetMs: 30 * 24 * 60 * 60 * 1000 },
};
