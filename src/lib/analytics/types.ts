/**
 * Analytics Event Types
 * Centralized type definitions for all trackable events
 */

/**
 * User authentication events
 */
export interface SignupCompletedEvent {
  userId: string;
  email: string;
  name: string;
  signupMethod: 'email' | 'google' | 'apple';
}

export interface LoginEvent {
  userId: string;
  loginMethod: 'email' | 'google' | 'apple';
}

/**
 * Agent lifecycle events
 */
export interface AgentCreatedEvent {
  agentId: string;
  agentName: string;
  userId: string;
}

export interface AgentDeletedEvent {
  agentId: string;
  userId: string;
}

/**
 * Subscription & billing events
 */
export interface CheckoutInitiatedEvent {
  planId: string;
  planName: string;
  planCode: string;
  amount: number;
  currency: string;
  billingInterval: 'monthly' | 'annual';
  userId: string;
}

export interface SubscriptionPurchasedEvent {
  subscriptionId: string;
  planName: string;
  planCode: string;
  amount: number;
  currency: string;
  billingInterval: string;
  paymentMethod: string;
  userId: string;
}

export interface SubscriptionCanceledEvent {
  subscriptionId: string;
  planName: string;
  userId: string;
}

export interface SubscriptionUpgradedEvent {
  subscriptionId: string;
  fromPlan: string;
  toPlan: string;
  userId: string;
}

export interface SubscriptionDowngradedEvent {
  subscriptionId: string;
  fromPlan: string;
  toPlan: string;
  userId: string;
}

/**
 * Lead generation events
 */
export interface LeadCapturedEvent {
  leadSource: string;
  contentName: string;
}

/**
 * Knowledge base events
 */
export interface KnowledgeBaseCreatedEvent {
  knowledgeBaseId: string;
  agentId: string;
  documentCount: number;
  userId: string;
}

/**
 * Integration events
 */
export interface IntegrationConnectedEvent {
  integrationType: 'whatsapp' | 'facebook' | 'instagram' | 'website';
  agentId: string;
  userId: string;
}

/**
 * Funnel events (signup → activation → conversion)
 */
export interface SignupPageViewEvent {
  referrer?: string;
}

export interface OnboardingStartedEvent {
  userId?: string;
}

export interface OnboardingStep1CompletedEvent {
  agentName: string;
}

export interface OnboardingStep2CompletedEvent {
  purposeCount: number;
}

export interface OnboardingStep3CompletedEvent {
  hasKnowledge: boolean;
}

export interface OnboardingSkippedEvent {
  skippedAtStep: number;
}

export interface FirstDashboardVisitEvent {
  userId: string;
}

export interface KnowledgeBaseAddedEvent {
  agentId: string;
  userId: string;
}

export interface FirstTestChatEvent {
  agentId: string;
  userId: string;
}

export interface ChannelConnectedEvent {
  platform: string;
  agentId: string;
  userId: string;
}

export interface SubscriptionPageVisitedEvent {
  userId: string;
}

/**
 * Page view events
 */
export interface PageViewEvent {
  pagePath: string;
  pageTitle: string;
  referrer?: string;
}

/**
 * Event map - maps event names to their payload types
 */
export interface AnalyticsEventMap {
  // Auth events
  signup_completed: SignupCompletedEvent;
  login: LoginEvent;

  // Agent events
  agent_created: AgentCreatedEvent;
  agent_deleted: AgentDeletedEvent;

  // Subscription events
  checkout_initiated: CheckoutInitiatedEvent;
  subscription_purchased: SubscriptionPurchasedEvent;
  subscription_canceled: SubscriptionCanceledEvent;
  subscription_upgraded: SubscriptionUpgradedEvent;
  subscription_downgraded: SubscriptionDowngradedEvent;

  // Lead events
  lead_captured: LeadCapturedEvent;

  // Knowledge base events
  knowledge_base_created: KnowledgeBaseCreatedEvent;

  // Integration events
  integration_connected: IntegrationConnectedEvent;

  // Funnel events
  signup_page_view: SignupPageViewEvent;
  onboarding_started: OnboardingStartedEvent;
  onboarding_step1_completed: OnboardingStep1CompletedEvent;
  onboarding_step2_completed: OnboardingStep2CompletedEvent;
  onboarding_step3_completed: OnboardingStep3CompletedEvent;
  onboarding_skipped: OnboardingSkippedEvent;
  first_dashboard_visit: FirstDashboardVisitEvent;
  knowledge_base_added: KnowledgeBaseAddedEvent;
  first_test_chat: FirstTestChatEvent;
  channel_connected: ChannelConnectedEvent;
  subscription_page_visited: SubscriptionPageVisitedEvent;

  // Page events
  page_view: PageViewEvent;
}

/**
 * Type-safe event names
 */
export type AnalyticsEventName = keyof AnalyticsEventMap;

/**
 * Extract event payload type from event name
 */
export type AnalyticsEventPayload<T extends AnalyticsEventName> = AnalyticsEventMap[T];

/**
 * Base analytics provider interface
 */
export interface AnalyticsProvider {
  name: string;
  isEnabled: boolean;
  initialize(): void;
  track<T extends AnalyticsEventName>(
    eventName: T,
    payload: AnalyticsEventPayload<T>
  ): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  enabledProviders: string[];
  debug: boolean;
  gtm?: {
    containerId: string;
  };
  metaPixel?: {
    pixelId: string;
  };
  googleAnalytics?: {
    measurementId: string;
  };
}
