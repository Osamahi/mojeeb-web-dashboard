import type { LucideIcon } from 'lucide-react';

/**
 * Navigation Item Configuration
 */
export interface NavigationItem {
  name: string;
  href?: string; // Optional: if not provided, item is non-navigable (display only)
  icon: LucideIcon;
  requireSuperAdmin?: boolean;
  requiresAgent?: boolean; // New: item requires an agent to be selected
  onClick?: () => void; // Optional: custom click handler for non-navigable items
}
