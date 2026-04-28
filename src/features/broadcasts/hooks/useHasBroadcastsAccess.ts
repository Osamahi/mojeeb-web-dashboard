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
 * Note: the sidebar link is SuperAdmin-only (see navigation.config.ts), so
 * Starter/Free users won't typically reach this page through the UI. The
 * upgrade prompt still renders for anyone who arrives via direct URL.
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
