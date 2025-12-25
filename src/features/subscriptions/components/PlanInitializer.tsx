import { useEffect } from 'react';
import { usePlanStore } from '../stores/planStore';

/**
 * PlanInitializer Component
 *
 * Loads plan data once when the app initializes (after user is authenticated).
 * This component is invisible and only exists to trigger the plan fetch side effect.
 *
 * Plans are loaded in parallel with subscription data to avoid delays when user
 * clicks "Upgrade Plan" button.
 *
 * Usage: Render inside AuthInitializer after auth validation succeeds
 */
export const PlanInitializer = () => {
  useEffect(() => {
    // loadPlans() handles checking if plans are already loaded/loading
    usePlanStore.getState().loadPlans();
  }, []); // Only run once on mount

  // This component renders nothing - it's just for the side effect
  return null;
};
