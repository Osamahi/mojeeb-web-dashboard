/**
 * useHasApiAccess
 *
 * Single source of truth for whether the current user can use the API
 * Keys feature. Mirrors useHasBroadcastsAccess.
 *
 * Access rules:
 *   - SuperAdmin: always full access (bypass — SuperAdmins have no subscription)
 *   - Professional plan: full access
 *   - Starter / Free / no subscription: NO access (page renders upgrade prompt)
 *
 * Note: the sidebar entry is plan-gated independently
 * (navigation.config.ts → requiredPlans), so non-Professional users
 * usually never see the link. The upgrade prompt covers anyone who
 * arrives via direct URL or stale tab.
 */

import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { PlanCode } from '@/features/subscriptions/types/subscription.types';

export function useHasApiAccess(): boolean {
  const isSuperAdmin = useAuthStore((s) => s.user?.role === Role.SuperAdmin);
  const planCode = useSubscriptionStore((s) => s.subscription?.planCode);

  if (isSuperAdmin) return true;
  return planCode === PlanCode.Professional;
}
