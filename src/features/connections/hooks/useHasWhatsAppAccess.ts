/**
 * useHasWhatsAppAccess
 *
 * Single source of truth for whether the current user can connect a
 * WhatsApp Business account. WhatsApp is a paid-only channel.
 *
 * Access rules:
 *   - SuperAdmin: always full access (bypass — SuperAdmins have no subscription)
 *   - Starter / Professional plan: full access
 *   - Free / no subscription: NO access (Connect button becomes Upgrade)
 */

import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { PlanCode } from '@/features/subscriptions/types/subscription.types';

export function useHasWhatsAppAccess(): boolean {
  const isSuperAdmin = useAuthStore((s) => s.user?.role === Role.SuperAdmin);
  const planCode = useSubscriptionStore((s) => s.subscription?.planCode);

  if (isSuperAdmin) return true;
  return planCode === PlanCode.Starter || planCode === PlanCode.Professional;
}
