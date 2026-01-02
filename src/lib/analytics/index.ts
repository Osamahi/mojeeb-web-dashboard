/**
 * Analytics Library
 * Unified, type-safe analytics tracking for Mojeeb Dashboard
 *
 * @example
 * ```tsx
 * // Initialize once in app entry point
 * import { analytics } from '@/lib/analytics';
 * analytics.initialize();
 *
 * // Track events in components
 * import { useAnalytics } from '@/lib/analytics';
 *
 * function MyComponent() {
 *   const { track } = useAnalytics();
 *
 *   const handleSignup = async () => {
 *     await signupUser();
 *     track('signup_completed', {
 *       userId: '123',
 *       email: 'user@example.com',
 *       name: 'John Doe',
 *       signupMethod: 'email',
 *     });
 *   };
 * }
 * ```
 */

// Core service
export { analytics } from './core/AnalyticsService';

// React hook
export { useAnalytics } from './hooks/useAnalytics';

// Types for external use
export type {
  AnalyticsEventName,
  AnalyticsEventPayload,
  AnalyticsEventMap,
  SignupCompletedEvent,
  LoginEvent,
  AgentCreatedEvent,
  CheckoutInitiatedEvent,
  SubscriptionPurchasedEvent,
  SubscriptionCanceledEvent,
  LeadCapturedEvent,
  PageViewEvent,
} from './types';

// Configuration (read-only)
export { analyticsConfig } from './config';
