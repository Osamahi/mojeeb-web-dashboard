import api from '@/lib/api';
import type { FunnelStep, FunnelStepUser } from '../types/funnel.types';

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
};
