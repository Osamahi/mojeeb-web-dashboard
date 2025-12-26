/**
 * Google Tag Manager tracking utilities
 *
 * This module provides type-safe functions for pushing events to GTM dataLayer.
 */

/**
 * Push agent creation success event to Google Tag Manager
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
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'agent_created',
      agent_id: agentId,
      agent_name: agentName,
      timestamp: new Date().toISOString(),
    });

    // Log to console in development for debugging
    if (import.meta.env.DEV) {
      console.log('[GTM] Agent Created:', {
        agent_id: agentId,
        agent_name: agentName,
      });
    }
  }
};

/**
 * Push user signup success event to Google Tag Manager
 *
 * @param userId - Unique identifier of the signed-up user
 * @param userEmail - Email address of the user
 * @param userName - Full name of the user
 * @param signupMethod - Method used for signup ('email' or 'google')
 *
 * @example
 * ```typescript
 * trackSignupSuccess(
 *   '123e4567-e89b-12d3-a456-426614174000',
 *   'user@example.com',
 *   'John Doe',
 *   'email'
 * );
 * ```
 */
export const trackSignupSuccess = (
  userId: string,
  userEmail: string,
  userName: string,
  signupMethod: 'email' | 'google'
): void => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'signup_successful',
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      signup_method: signupMethod,
      timestamp: new Date().toISOString(),
    });

    // Log to console in development for debugging
    if (import.meta.env.DEV) {
      console.log('[GTM] Signup Success:', {
        user_id: userId,
        user_email: userEmail,
        signup_method: signupMethod,
      });
    }
  }
};
