import type { LucideIcon } from 'lucide-react';

/**
 * Navigation Item Configuration
 */
export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  requireSuperAdmin?: boolean;
  requiresAgent?: boolean; // New: item requires an agent to be selected
}
