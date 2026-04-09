/**
 * useHasBroadcastsAccess
 *
 * Single source of truth for whether the current user can actually USE
 * the Broadcasts feature (send campaigns, view data). Shared between
 * BroadcastsPage and BroadcastDetailPage so the guard logic stays in one place.
 *
 * Access rules:
 *   - SuperAdmin: always full access (bypass — SuperAdmins have no subscription)
 *   - Professional plan: full access
 *   - Starter / Free / no subscription: NO access (page renders an upgrade prompt)
 *
 * Note: Starter users still see the sidebar link (see navigation.config.ts)
 * so they can discover the feature — they land on the page and get the
 * in-page upgrade prompt.
 */

import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { PlanCode } from '@/features/subscriptions/types/subscription.types';

export function useHasBroadcastsAccess(): boolean {
  const isSuperAdmin = useAuthStore((s) => s.user?.role === Role.SuperAdmin);
  const planCode = useSubscriptionStore((s) => s.subscription?.planCode);

  if (isSuperAdmin) return true;
  return planCode === PlanCode.Professional;
}
