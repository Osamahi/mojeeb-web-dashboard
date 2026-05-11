import type { LucideIcon } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

/** A Lucide icon or any SVG component that accepts className */
export type NavigationIcon = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Navigation Item Configuration
 */
export interface NavigationItem {
  name: string; // Fallback label (English) for non-translated contexts
  translationKey?: string; // i18n translation key (e.g., 'navigation.chats')
  href?: string; // Optional: if not provided, item is non-navigable (display only)
  icon: NavigationIcon;
  requireSuperAdmin?: boolean;
  /**
   * Restrict sidebar visibility to users on one of these plan codes.
   * SuperAdmin bypasses this check. If the user has no subscription or their
   * plan is not in the list, the item is hidden.
   */
  requiredPlans?: string[];
  requiresAgent?: boolean; // New: item requires an agent to be selected
  onClick?: () => void; // Optional: custom click handler for non-navigable items
  /**
   * Optional small "catch-the-eye" pill label next to the item label —
   * typically "NEW" for recently-shipped surfaces. Pass the i18n translation
   * key (e.g. 'navigation.badge_new') so the pill stays localized. When the
   * sidebar is collapsed the pill collapses to a tiny corner dot so the signal
   * survives without consuming horizontal space.
   */
  badge?: string;
}
