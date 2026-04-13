export interface FunnelStep {
  eventName: string;
  uniqueUsers: number;
  uniqueSessions: number;
}

export interface FunnelStepUser {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userCreatedAt: string;
  agentName: string | null;
  eventCreatedAt: string;
}

export interface FunnelRecentEvent {
  id: string;
  eventName: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  agentName: string | null;
  sessionId: string;
  referrer: string | null;
  properties: Record<string, unknown> | null;
  createdAt: string;
}

export interface CursorPaginatedFunnelEvents {
  events: FunnelRecentEvent[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type DateRangePreset = 'today' | '7d' | '30d' | '90d';

/**
 * Funnel stages in display order.
 * To add a new step: add the event_name string here.
 * No chart code, SQL, or backend changes needed.
 */
export const FUNNEL_STAGES = [
  'signup_page_view',
  'signup_completed',
  'onboarding_started',
  'onboarding_step1_completed',
  'onboarding_step2_completed',
  'onboarding_step3_completed',
  'agent_created',
  'first_dashboard_visit',
  'knowledge_base_added',
  'first_test_chat',
  'channel_connected',
  'subscription_page_visited',
  'checkout_initiated',
  'subscription_purchased',
] as const;

export type FunnelStageName = (typeof FUNNEL_STAGES)[number];

/** Human-readable labels for each funnel stage */
export const STAGE_LABELS: Record<string, string> = {
  signup_page_view: 'Signup Page View',
  signup_completed: 'Signup Completed',
  onboarding_started: 'Onboarding Started',
  onboarding_step1_completed: 'Agent Named',
  onboarding_step2_completed: 'Purpose Selected',
  onboarding_step3_completed: 'Knowledge Added',
  agent_created: 'Agent Created',
  first_dashboard_visit: 'Dashboard Visit',
  knowledge_base_added: 'KB Added',
  first_test_chat: 'Test Chat',
  channel_connected: 'Channel Connected',
  subscription_page_visited: 'Subscription Page',
  checkout_initiated: 'Checkout Started',
  subscription_purchased: 'Subscribed',
};
