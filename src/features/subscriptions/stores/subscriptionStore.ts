import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SubscriptionDetails, UsageSummary } from '../types/subscription.types';
import { subscriptionService } from '../services/subscriptionService';
import { logger } from '@/lib/logger';

interface SubscriptionState {
  subscription: SubscriptionDetails | null;
  usage: UsageSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSubscription: (subscription: SubscriptionDetails | null) => void;
  setUsage: (usage: UsageSummary | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSubscription: () => void;
  refreshSubscription: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      usage: null,
      isLoading: false,
      error: null,

      setSubscription: (subscription) => {
        logger.info('[SubscriptionStore]', 'setSubscription:', subscription?.planCode || 'null');
        set({ subscription, error: null });
      },

      setUsage: (usage) => {
        logger.info('[SubscriptionStore]', 'setUsage:', usage ? `${usage.messagesUsed}/${usage.messagesLimit}` : 'null');
        set({ usage });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearSubscription: () => {
        logger.info('[SubscriptionStore]', 'clearSubscription');
        set({ subscription: null, usage: null, isLoading: false, error: null });
        // Zustand persist middleware automatically syncs this cleared state to localStorage
      },

      refreshSubscription: async () => {
        logger.info('[SubscriptionStore]', 'refreshSubscription - fetching latest subscription and usage data');
        try {
          set({ isLoading: true, error: null });

          // Fetch both subscription and usage in one API call (optimized)
          const data = await subscriptionService.getMySubscriptionWithUsage();

          set({
            subscription: data.subscription,
            usage: data.usage,
            isLoading: false
          });

          logger.info('[SubscriptionStore]', 'refreshSubscription - success:', {
            plan: data.subscription.planCode,
            usage: `${data.usage.messagesUsed}/${data.usage.messagesLimit}`
          });
        } catch (error) {
          logger.error('[SubscriptionStore]', 'refreshSubscription - error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load subscription',
            isLoading: false
          });
        }
      },
    }),
    {
      name: 'mojeeb-subscription-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        subscription: state.subscription,
        usage: state.usage,
      }),
    }
  )
);
