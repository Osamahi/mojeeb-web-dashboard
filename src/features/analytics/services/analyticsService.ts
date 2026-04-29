import api from '@/lib/api';
import type {
  AnalyticsMetric,
  AngryConversation,
  AngryConversationWire,
  LiveSummary,
  LiveSummaryWire,
  MetricsTimeseries,
  MetricsTimeseriesPoint,
  MetricsTimeseriesPointWire,
  MetricsTimeseriesWire,
} from '../types/analytics.types';

/**
 * Service layer for live per-agent analytics endpoints.
 *
 * Backend routes (all gated by [OrgPermission("read")]):
 *   GET /api/v2/agents/{agentId}/analytics/live-summary
 *   GET /api/v2/agents/{agentId}/analytics/timeseries
 *   GET /api/v2/agents/{agentId}/analytics/angry
 *
 * Wire format is snake_case; transformers below convert to camelCase
 * before returning to hooks/components.
 */

// ============================================================================
// Transformers — wire (snake_case) → frontend (camelCase)
// ============================================================================

function toLiveSummary(wire: LiveSummaryWire): LiveSummary {
  return {
    asOf: wire.as_of,
    dayStart: wire.day_start,
    messagesToday: wire.messages_today,
    conversationsActive: wire.conversations_active,
    uniqueCustomersToday: wire.unique_customers_today,
    avgSentimentToday: wire.avg_sentiment_today,
    angryCountToday: wire.angry_count_today,
    actionsExecutedToday: wire.actions_executed_today,
  };
}

function toTimeseriesPoint(wire: MetricsTimeseriesPointWire): MetricsTimeseriesPoint {
  return {
    bucketAt: wire.bucket_at,
    value: wire.value,
  };
}

function toTimeseries(wire: MetricsTimeseriesWire): MetricsTimeseries {
  return {
    agentId: wire.agent_id,
    metric: wire.metric,
    granularityMinutes: wire.granularity_minutes,
    from: wire.from,
    to: wire.to,
    points: (wire.points ?? []).map(toTimeseriesPoint),
  };
}

function toAngryConversation(wire: AngryConversationWire): AngryConversation {
  return {
    conversationId: wire.conversation_id,
    firstBecameAngryAt: wire.first_became_angry_at,
    firstSentimentValue: wire.first_sentiment_value,
    sourceId: wire.source_id,
    customerName: wire.customer_name,
    lastMessage: wire.last_message,
    lastMessageAt: wire.last_message_at,
    status: wire.status,
  };
}

// ============================================================================
// Public service
// ============================================================================

export const analyticsService = {
  /**
   * Today's hero numbers for the dashboard. Single round-trip.
   * Backend's BaseController wraps the response in `{ data: ... }`.
   */
  getLiveSummary: async (agentId: string): Promise<LiveSummary> => {
    const { data } = await api.get(`/api/v2/agents/${agentId}/analytics/live-summary`);
    return toLiveSummary(data.data as LiveSummaryWire);
  },

  /**
   * Time-series chart data for one metric over a window.
   * `from` and `to` are ISO 8601 UTC strings.
   */
  getTimeseries: async (
    agentId: string,
    metric: AnalyticsMetric,
    from: string,
    to?: string,
    granularityMinutes = 1
  ): Promise<MetricsTimeseries> => {
    const params: Record<string, string> = {
      metric,
      from,
      granularityMinutes: granularityMinutes.toString(),
    };
    if (to) {
      params.to = to;
    }

    const { data } = await api.get(`/api/v2/agents/${agentId}/analytics/timeseries`, {
      params,
    });
    return toTimeseries(data.data as MetricsTimeseriesWire);
  },

  /**
   * List of conversations that became angry since the given timestamp (default 24h ago).
   * Deduped at the source — one row per conversation, ever.
   */
  getAngryConversations: async (
    agentId: string,
    since?: string,
    limit = 100
  ): Promise<AngryConversation[]> => {
    const params: Record<string, string> = { limit: limit.toString() };
    if (since) {
      params.since = since;
    }

    const { data } = await api.get(`/api/v2/agents/${agentId}/analytics/angry`, {
      params,
    });
    return (data.data as AngryConversationWire[]).map(toAngryConversation);
  },
};
