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
}
