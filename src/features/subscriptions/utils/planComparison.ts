/**
 * Plan comparison utilities for Stripe checkout integration
 * Determines if a plan change is an upgrade, downgrade, or lateral move
 */

import { PlanCode } from '../types/subscription.types';

/**
 * Plan tier hierarchy (lower number = lower tier)
 */
const PLAN_TIER_HIERARCHY: Record<string, number> = {
  [PlanCode.Free]: 0,
  [PlanCode.Starter]: 1,
  [PlanCode.Professional]: 2,
  [PlanCode.Enterprise]: 3,
};

/**
 * Determines if changing from one plan to another constitutes an upgrade
 * @param currentPlanCode - Current subscription plan code
 * @param targetPlanCode - Target plan code user wants to switch to
 * @returns true if target plan is higher tier than current plan
 */
export function isUpgrade(currentPlanCode: string, targetPlanCode: string): boolean {
  const currentTier = PLAN_TIER_HIERARCHY[currentPlanCode] ?? -1;
  const targetTier = PLAN_TIER_HIERARCHY[targetPlanCode] ?? -1;

  // If either plan is not in hierarchy, treat as non-upgrade (safety default)
  if (currentTier === -1 || targetTier === -1) {
    return false;
  }

  return targetTier > currentTier;
}

/**
 * Determines if changing from one plan to another constitutes a downgrade
 * @param currentPlanCode - Current subscription plan code
 * @param targetPlanCode - Target plan code user wants to switch to
 * @returns true if target plan is lower tier than current plan
 */
export function isDowngrade(currentPlanCode: string, targetPlanCode: string): boolean {
  const currentTier = PLAN_TIER_HIERARCHY[currentPlanCode] ?? -1;
  const targetTier = PLAN_TIER_HIERARCHY[targetPlanCode] ?? -1;

  // If either plan is not in hierarchy, treat as non-downgrade (safety default)
  if (currentTier === -1 || targetTier === -1) {
    return false;
  }

  return targetTier < currentTier;
}

/**
 * Determines if plan change requires payment (upgrades require Stripe checkout)
 * @param currentPlanCode - Current subscription plan code
 * @param targetPlanCode - Target plan code user wants to switch to
 * @returns true if plan change requires going through Stripe checkout
 */
export function requiresPayment(currentPlanCode: string, targetPlanCode: string): boolean {
  // Upgrades always require payment
  if (isUpgrade(currentPlanCode, targetPlanCode)) {
    return true;
  }

  // Moving from free to any paid plan requires payment (even if same tier)
  if (currentPlanCode === PlanCode.Free && targetPlanCode !== PlanCode.Free) {
    return true;
  }

  // Downgrades and lateral moves don't require payment
  return false;
}

/**
 * Gets the tier level of a plan (useful for sorting/comparison)
 * @param planCode - Plan code to get tier for
 * @returns Tier level (0-3) or -1 if unknown
 */
export function getPlanTier(planCode: string): number {
  return PLAN_TIER_HIERARCHY[planCode] ?? -1;
}

/**
 * Gets human-readable description of plan change type
 * @param currentPlanCode - Current subscription plan code
 * @param targetPlanCode - Target plan code user wants to switch to
 * @returns Description of change type
 */
export function getPlanChangeType(currentPlanCode: string, targetPlanCode: string): string {
  if (currentPlanCode === targetPlanCode) {
    return 'No change';
  }

  if (isUpgrade(currentPlanCode, targetPlanCode)) {
    return 'Upgrade';
  }

  if (isDowngrade(currentPlanCode, targetPlanCode)) {
    return 'Downgrade';
  }

  return 'Plan change';
}
