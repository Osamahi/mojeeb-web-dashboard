import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SubscriptionPlan } from '../types/subscription.types';
import { subscriptionService } from '../services/subscriptionService';
import { logger } from '@/lib/logger';

interface PlanState {
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  loadPlans: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  clearPlans: () => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plans: [],
      isLoading: false,
      error: null,
      lastFetched: null,

      loadPlans: async () => {
        // Only load if not already loaded (unless stale)
        const { plans, lastFetched, isLoading } = get();

        // Skip if already loading
        if (isLoading) {
          logger.info('[PlanStore]', 'Already loading, skipping...');
          return;
        }

        // Check if data is stale (1 hour TTL)
        const ONE_HOUR = 60 * 60 * 1000;
        const isStale = !lastFetched || (Date.now() - lastFetched) > ONE_HOUR;

        if (plans.length > 0 && !isStale) {
          logger.info('[PlanStore]', 'Plans already loaded and fresh, skipping...');
          return;
        }

        logger.info('[PlanStore]', 'Loading plans...');
        try {
          set({ isLoading: true, error: null });
          const data = await subscriptionService.getPlans();
          set({
            plans: data,
            isLoading: false,
            lastFetched: Date.now()
          });
          logger.info('[PlanStore]', 'Plans loaded successfully:', data.length);
        } catch (error) {
          logger.error('[PlanStore]', 'Failed to load plans:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load plans',
            isLoading: false
          });
        }
      },

      refreshPlans: async () => {
        logger.info('[PlanStore]', 'Force refreshing plans...');
        set({ lastFetched: null }); // Force refresh by invalidating cache
        await get().loadPlans();
      },

      clearPlans: () => {
        logger.info('[PlanStore]', 'Clearing plans');
        set({ plans: [], isLoading: false, error: null, lastFetched: null });
        // Zustand persist middleware automatically syncs this cleared state to localStorage
      },
    }),
    {
      name: 'mojeeb-plans-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        plans: state.plans,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
