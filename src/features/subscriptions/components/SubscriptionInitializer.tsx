import { useEffect } from 'react';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import { logger } from '@/lib/logger';

/**
 * SubscriptionInitializer Component
 *
 * Loads subscription data once when the app initializes (after user is authenticated).
 * This component is invisible and only exists to trigger the subscription fetch side effect.
 * Skips fetching for SuperAdmin users who don't have subscriptions.
 *
 * Usage: Render inside AuthInitializer after auth validation succeeds
 */
export const SubscriptionInitializer = () => {
  useEffect(() => {
    const loadSubscription = async () => {
      const user = useAuthStore.getState().user;

      // SuperAdmins don't have subscriptions - skip the API call entirely
      if (user?.role === Role.SuperAdmin) {
        logger.debug('[SubscriptionInitializer]', 'SuperAdmin detected - skipping subscription fetch');
        return;
      }

      logger.info('[SubscriptionInitializer]', 'Loading subscription data...');
      try {
        await useSubscriptionStore.getState().refreshSubscription();
        const subscription = useSubscriptionStore.getState().subscription;
        logger.info('[SubscriptionInitializer]', 'Subscription loaded successfully:', subscription?.planCode || 'none');
      } catch (error) {
        logger.error('[SubscriptionInitializer]', 'Failed to load subscription:', error);
        // Silently fail - subscription is not critical for app functionality
        // User can still use the app, just won't see upgrade prompts
      }
    };

    loadSubscription();
  }, []); // Only run once on mount

  // This component renders nothing - it's just for the side effect
  return null;
};
