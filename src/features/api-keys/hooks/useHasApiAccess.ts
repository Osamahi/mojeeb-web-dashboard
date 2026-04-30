/**
 * useHasApiAccess
 *
 * Source of truth for whether the current user can manage API keys.
 *
 * Access rules (mirror useHasBroadcastsAccess):
 *   - SuperAdmin: always full access (bypass — SuperAdmins have no subscription)
 *   - Plans with the 'api_access' feature: full access
 *   - Otherwise: NO access (page renders an upgrade prompt)
 *
 * The 'api_access' feature flag is set per-plan by the admin in the
 * subscription_plans table. Today only Professional has it; admins can flip
 * it on for other plans without code changes.
 *
 * Implementation note: each Zustand selector below returns a stable
 * primitive (boolean). Returning a fresh array (e.g. `s.subscription?.features ?? []`)
 * would create a new reference every render, triggering React's
 * "getSnapshot should be cached" warning and an infinite re-render loop.
 */

import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';

export function useHasApiAccess(): boolean {
  const isSuperAdmin = useAuthStore((s) => s.user?.role === Role.SuperAdmin);
  const hasApiAccessFeature = useSubscriptionStore(
    (s) => s.subscription?.features?.includes('api_access') ?? false
  );

  return isSuperAdmin || hasApiAccessFeature;
}
