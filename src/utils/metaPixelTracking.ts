/**
 * Meta Pixel (Facebook Pixel) tracking utilities
 *
 * This module provides type-safe functions for tracking conversion events with Meta Pixel.
 */

/**
 * Track agent creation success event to Meta Pixel
 *
 * @param agentId - Unique identifier of the created agent
 * @param agentName - User-provided name for the agent
 *
 * @example
 * ```typescript
 * trackAgentCreated('123e4567-e89b-12d3-a456-426614174000', 'My Support Bot');
 * ```
 */
export const trackAgentCreated = (agentId: string, agentName: string): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'AgentCreated', {
      agent_id: agentId,
      agent_name: agentName,
      timestamp: new Date().toISOString(),
    });

    // Log to console in development for debugging
    if (import.meta.env.DEV) {
      console.log('[Meta Pixel] Agent Created:', {
        agent_id: agentId,
        agent_name: agentName,
      });
    }
  }
};

/**
 * Track user signup completion event to Meta Pixel
 *
 * @param userId - Unique identifier of the signed-up user
 * @param userEmail - Email address of the user (hashed for privacy)
 * @param userName - Full name of the user
 * @param signupMethod - Method used for signup ('email' or 'google')
 *
 * @example
 * ```typescript
 * trackSignupCompleted(
 *   '123e4567-e89b-12d3-a456-426614174000',
 *   'user@example.com',
 *   'John Doe',
 *   'email'
 * );
 * ```
 */
export const trackSignupCompleted = (
  userId: string,
  userEmail: string,
  userName: string,
  signupMethod: 'email' | 'google'
): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      content_name: 'User Signup',
      status: 'completed',
      user_id: userId,
      signup_method: signupMethod,
    });

    // Log to console in development for debugging
    if (import.meta.env.DEV) {
      console.log('[Meta Pixel] Signup Completed:', {
        user_id: userId,
        user_email: userEmail,
        signup_method: signupMethod,
      });
    }
  }
};

/**
 * Track subscription purchase event to Meta Pixel
 *
 * @param planName - Name of the subscription plan (e.g., 'Starter', 'Professional')
 * @param value - Monetary value of the subscription
 * @param currency - Currency code (e.g., 'USD', 'EGP', 'SAR')
 *
 * @example
 * ```typescript
 * trackSubscriptionPurchase('Professional', 99.00, 'USD');
 * ```
 */
export const trackSubscriptionPurchase = (
  planName: string,
  value: number,
  currency: string
): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_name: `${planName} Plan`,
      content_type: 'product',
      value: value,
      currency: currency,
    });

    // Log to console in development for debugging
    if (import.meta.env.DEV) {
      console.log('[Meta Pixel] Subscription Purchase:', {
        plan: planName,
        value: value,
        currency: currency,
      });
    }
  }
};

/**
 * Track subscription checkout initiation to Meta Pixel
 *
 * @param planName - Name of the subscription plan
 * @param value - Monetary value of the subscription
 * @param currency - Currency code
 *
 * @example
 * ```typescript
 * trackCheckoutInitiated('Starter', 25.00, 'USD');
 * ```
 */
export const trackCheckoutInitiated = (
  planName: string,
  value: number,
  currency: string
): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_name: `${planName} Plan`,
      content_category: 'Subscription',
      value: value,
      currency: currency,
    });

    // Log to console in development for debugging
    if (import.meta.env.DEV) {
      console.log('[Meta Pixel] Checkout Initiated:', {
        plan: planName,
        value: value,
        currency: currency,
      });
    }
  }
};

/**
 * Track lead generation event to Meta Pixel
 *
 * @param leadSource - Source of the lead (e.g., 'onboarding', 'trial_signup')
 * @param contentName - Name/description of the content that generated the lead
 *
 * @example
 * ```typescript
 * trackLead('trial_signup', 'Free Trial Started');
 * ```
 */
export const trackLead = (leadSource: string, contentName: string): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: contentName,
      content_category: leadSource,
    });

    // Log to console in development for debugging
    if (import.meta.env.DEV) {
      console.log('[Meta Pixel] Lead:', {
        source: leadSource,
        content_name: contentName,
      });
    }
  }
};
