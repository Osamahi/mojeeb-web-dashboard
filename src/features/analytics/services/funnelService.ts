import api from '@/lib/api';
import type { FunnelStep, FunnelStepUser, CursorPaginatedFunnelEvents } from '../types/funnel.types';

interface RawFunnelStep {
  event_name: string;
  unique_users: number;
  unique_sessions: number;
}

interface RawStepUser {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_created_at: string;
  agent_name: string | null;
  event_created_at: string;
}

export const funnelService = {
  getSummary: async (startDate: string, endDate: string): Promise<FunnelStep[]> => {
    const { data } = await api.get('/api/admin/funnel/summary', {
      params: { start_date: startDate, end_date: endDate },
    });

    return (data.data as RawFunnelStep[]).map((s) => ({
      eventName: s.event_name,
      uniqueUsers: s.unique_users,
      uniqueSessions: s.unique_sessions,
    }));
  },

  getStepUsers: async (
    eventName: string,
    startDate: string,
    endDate: string,
    limit = 100,
    offset = 0
  ): Promise<FunnelStepUser[]> => {
    const { data } = await api.get('/api/admin/funnel/step-users', {
      params: { event_name: eventName, start_date: startDate, end_date: endDate, limit, offset },
    });

    return (data.data as RawStepUser[]).map((u) => ({
      userId: u.user_id,
      userName: u.user_name,
      userEmail: u.user_email,
      userCreatedAt: u.user_created_at,
      agentName: u.agent_name,
      eventCreatedAt: u.event_created_at,
    }));
  },

  getRecentEvents: async (
    startDate: string,
    endDate: string,
    limit = 50,
    cursor?: string
  ): Promise<CursorPaginatedFunnelEvents> => {
    const params: Record<string, string> = {
      start_date: startDate,
      end_date: endDate,
      limit: limit.toString(),
    };
    if (cursor) params.cursor = cursor;

    const { data } = await api.get('/api/admin/funnel/recent-events', { params });

    return {
      events: (data.items as any[]).map((e) => ({
        id: e.id,
        eventName: e.event_name,
        userId: e.user_id,
        userName: e.user_name,
        userEmail: e.user_email,
        agentName: e.agent_name,
        sessionId: e.session_id,
        referrer: e.referrer,
        properties: e.properties,
        createdAt: e.created_at,
      })),
      nextCursor: data.next_cursor ?? null,
      hasMore: data.has_more ?? false,
    };
  },
};
